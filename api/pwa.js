const { assertAdminToken, readJsonFile, writeJsonFile, sanitizeText } = require("../lib/github");
const { recordMetric } = require("../lib/metrics");
const {
  VALID_AVISOS,
  cleanAvisos,
  cleanSubscription: cleanPushSubscription,
  cleanZona,
  ensureSupabaseEnv,
  ensureVapidEnv,
  getAdminToken,
  maskEndpoint,
  normalizeUrl: normalizePushUrl,
  supabaseRequest,
  debugEnv,
  eq,
} = require("../lib/supabase-push");

const REPORTS_PATH = "data/admin/reportes.json";
const METRICS_PATH = "data/admin/metricas.json";
const PUSH_PATH = "data/admin/push-subscriptions.json";
const LIVE_PATH = "live.json";
const LIVE_ZONAS = new Set(["c", "i", "mat1", "mat4"]);
const LIVE_ESTADOS = new Set(["Previa", "Primer Tiempo", "Entretiempo", "Segundo Tiempo", "Finalizado"]);
const LIVE_CATEGORIAS = {
  c: ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
  i: ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
  mat1: ["2013", "2014/15", "2016/17", "2018/19", "2020/21/22"],
  mat4: ["2013", "2014", "2015", "2016", "2017", "2018/19/20"],
};
const DEFAULT_LIVE = { activo: false, zona: "", categoria: "", fecha: "", estado: "Previa", minuto: 0, local: "", visitante: "", condicion: "", goles_local: 0, goles_visitante: 0, updated_at: null };
let liveCache = { at: 0, data: null };
const TIPOS = new Set(["Resultado mal cargado", "Fixture incorrecto", "Tabla incorrecta", "Horario/dirección incorrecta", "Otro"]);

function routeFrom(req) {
  const url = new URL(req.url || "/", "https://baby-allboys.local");
  return (url.searchParams.get("route") || "").replace(/^\//, "");
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeReports(data) {
  return { reportes: Array.isArray(data && data.reportes) ? data.reportes : [] };
}

function normalizePush(data) {
  return { subscriptions: Array.isArray(data && data.subscriptions) ? data.subscriptions : [] };
}

function cleanSubscription(raw) {
  if (!raw || typeof raw !== "object") return null;
  const endpoint = sanitizeText(raw.endpoint, 600);
  const p256dh = sanitizeText(raw.keys && raw.keys.p256dh, 300);
  const auth = sanitizeText(raw.keys && raw.keys.auth, 160);
  if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

function normalizeUrl(url) {
  const raw = sanitizeText(url || "/", 180);
  if (!raw || raw.startsWith("http://") || raw.startsWith("//")) return "/";
  if (raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (error) {
      return "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function clampInt(value, min, max) {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function cleanLiveZona(value) {
  const zona = String(value || "").trim().toLowerCase();
  return LIVE_ZONAS.has(zona) ? zona : "";
}

function cleanLiveEstado(value) {
  const estado = sanitizeText(value, 40);
  return LIVE_ESTADOS.has(estado) ? estado : "Previa";
}

function cleanLiveCategoria(zona, value) {
  const categoria = sanitizeText(value, 20);
  return (LIVE_CATEGORIAS[zona] || []).includes(categoria) ? categoria : "";
}

function normalizeLive(data) {
  const raw = data && typeof data === "object" ? data : {};
  return {
    ...DEFAULT_LIVE,
    activo: raw.activo === true,
    zona: cleanLiveZona(raw.zona),
    categoria: sanitizeText(raw.categoria, 20),
    fecha: sanitizeText(raw.fecha, 20),
    estado: cleanLiveEstado(raw.estado),
    minuto: clampInt(raw.minuto, 0, 80),
    local: sanitizeText(raw.local, 90),
    visitante: sanitizeText(raw.visitante, 90),
    condicion: sanitizeText(raw.condicion, 30),
    goles_local: clampInt(raw.goles_local, 0, 99),
    goles_visitante: clampInt(raw.goles_visitante, 0, 99),
    updated_at: sanitizeText(raw.updated_at, 40) || null,
  };
}

async function readLiveData() {
  if (liveCache.data && Date.now() - liveCache.at < 12000) return liveCache.data;
  const file = await readJsonFile(LIVE_PATH, DEFAULT_LIVE);
  const data = normalizeLive(file.data);
  liveCache = { at: Date.now(), data };
  return data;
}

function findLiveFixture(zona, fecha) {
  const fixture = require(`../data/${zona}/fixture.json`);
  return (Array.isArray(fixture) ? fixture : []).find((partido) => String(partido.fecha_id || "") === fecha) || null;
}

function buildLivePayload(body) {
  const zona = cleanLiveZona(body && body.zona);
  if (!zona) {
    const error = new Error("Zona invalida.");
    error.statusCode = 400;
    throw error;
  }

  const fecha = sanitizeText(body && body.fecha, 20);
  const categoria = cleanLiveCategoria(zona, body && body.categoria);
  if (!fecha || !categoria) {
    const error = new Error("Fecha o categoria invalida.");
    error.statusCode = 400;
    throw error;
  }

  const partido = findLiveFixture(zona, fecha);
  if (!partido) {
    const error = new Error("No se encontro el partido en el fixture oficial.");
    error.statusCode = 400;
    throw error;
  }

  return normalizeLive({
    activo: body && body.activo === true,
    zona,
    categoria,
    fecha,
    estado: body && body.estado,
    minuto: body && body.minuto,
    local: partido.local,
    visitante: partido.visitante,
    condicion: partido.condicion,
    goles_local: body && body.goles_local,
    goles_visitante: body && body.goles_visitante,
    updated_at: new Date().toISOString(),
  });
}

async function liveData(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method === "GET") return res.status(200).json({ ok: true, live: await readLiveData() });
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  assertAdminToken(req.body && req.body.token);
  const current = await readJsonFile(LIVE_PATH, DEFAULT_LIVE);
  const live = buildLivePayload(req.body || {});
  await writeJsonFile(LIVE_PATH, live, current.sha, "actualiza jornada en vivo");
  liveCache = { at: Date.now(), data: live };
  return res.status(200).json({ ok: true, live });
}

async function reportarError(req, res) {
  const body = req.body || {};
  const comentario = sanitizeText(body.comentario, 500);
  if (comentario.length < 5) return res.status(400).json({ ok: false, error: "El comentario debe tener al menos 5 caracteres." });
  if (String(body.comentario || "").length > 600) return res.status(400).json({ ok: false, error: "El comentario es demasiado largo." });

  const file = await readJsonFile(REPORTS_PATH, { reportes: [] });
  const data = normalizeReports(file.data);
  const reporte = {
    id: makeId(),
    created_at: new Date().toISOString(),
    zona: sanitizeText(body.zona, 16),
    vista: sanitizeText(body.vista, 32),
    fecha: sanitizeText(body.fecha, 32),
    categoria: sanitizeText(body.categoria, 32),
    tipo: TIPOS.has(body.tipo) ? body.tipo : "Otro",
    comentario,
    contacto: sanitizeText(body.contacto, 120),
    estado: "nuevo",
    userAgent: sanitizeText(req.headers["user-agent"], 160),
  };
  data.reportes.unshift(reporte);
  await writeJsonFile(REPORTS_PATH, data, file.sha, "agrega reporte de error");
  recordMetric({ event: "report_error_sent", zona: reporte.zona, vista: reporte.vista }, "actualiza metricas por reporte").catch(() => {});
  return res.status(200).json({ ok: true, reporte: { id: reporte.id } });
}

async function trackEvent(req, res) {
  // El tracking publico generaba commits por navegacion y podia chocar por SHA
  // en GitHub Contents API cuando llegaban eventos simultaneos. Lo dejamos
  // como no-op exitoso para que la app nunca muestre errores de consola.
  return res.status(200).json({ ok: true, disabled: true });
}

function pushPublicKey(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!publicKey) return res.status(200).json({ ok: false, supported: false, error: "VAPID_PUBLIC_KEY no configurada." });
  return res.status(200).json({ ok: true, publicKey });
}

async function pushSubscribeSupabase(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  ensureSupabaseEnv();
  const subscription = cleanPushSubscription(req.body && req.body.subscription);
  if (!subscription) return res.status(400).json({ ok: false, error: "Suscripcion push invalida." });
  const now = new Date().toISOString();
  const row = {
    endpoint: subscription.endpoint,
    subscription,
    zona: cleanZona(req.body && req.body.zona) || null,
    equipo: sanitizeText(req.body && req.body.equipo, 80) || null,
    avisos: cleanAvisos(req.body && req.body.avisos),
    user_agent: sanitizeText((req.body && req.body.userAgent) || req.headers["user-agent"], 220),
    activo: true,
    updated_at: now,
    last_seen_at: now,
  };
  await supabaseRequest("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  recordMetric({ event: "push_subscribe_success", zona: row.zona || "", vista: "push" }, "actualiza metricas por push").catch(() => {});
  return res.status(200).json({ ok: true });
}

async function pushUnsubscribeSupabase(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  ensureSupabaseEnv();
  const endpoint = sanitizeText(req.body && req.body.endpoint, 900);
  if (!endpoint) return res.status(400).json({ ok: false, error: "Endpoint obligatorio." });
  await supabaseRequest(`push_subscriptions?endpoint=${eq(endpoint)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ activo: false, updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }),
  });
  return res.status(200).json({ ok: true });
}

async function pushSendSupabase(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  assertAdminToken(getAdminToken(req));
  ensureSupabaseEnv();
  ensureVapidEnv();
  const title = sanitizeText(req.body && req.body.title, 90) || "Baby All Boys";
  const body = sanitizeText(req.body && req.body.body, 220);
  if (!body) return res.status(400).json({ ok: false, error: "Mensaje obligatorio." });
  const zona = cleanZona(req.body && req.body.zona);
  const avisoTipo = sanitizeText(req.body && req.body.avisoTipo, 32).toLowerCase();
  const categoria = sanitizeText(req.body && req.body.categoria, 32);
  const url = normalizePushUrl(req.body && req.body.url);

  const query = [
    "select=endpoint,subscription,zona,avisos,error_count",
    "activo=eq.true",
    zona ? `zona=eq.${encodeURIComponent(zona)}` : "",
    "order=created_at.desc",
    "limit=5000",
  ].filter(Boolean).join("&");
  const rows = await supabaseRequest(`push_subscriptions?${query}`);
  const targets = (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!avisoTipo || !VALID_AVISOS.has(avisoTipo)) return true;
    return Array.isArray(row.avisos) && row.avisos.includes(avisoTipo);
  });

  const webpush = require("web-push");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/maskable-192.png",
    tag: avisoTipo ? `baby-${avisoTipo}-${zona || "todas"}` : "baby-allboys",
    data: { url },
  });

  let enviados = 0;
  let fallidos = 0;
  for (const row of targets) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      enviados += 1;
    } catch (error) {
      fallidos += 1;
      const inactive = error.statusCode === 404 || error.statusCode === 410;
      await supabaseRequest(`push_subscriptions?endpoint=${eq(row.endpoint)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          activo: inactive ? false : true,
          error_count: Number(row.error_count || 0) + 1,
          last_error: sanitizeText(error.body || error.message || `HTTP ${error.statusCode || ""}`, 280),
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  await supabaseRequest("push_logs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ title, body, url, zona: zona || null, aviso_tipo: avisoTipo || null, categoria: categoria || null, enviados, fallidos }),
  }).catch(() => {});

  return res.status(200).json({ ok: true, enviados, fallidos });
}

async function pushStatsSupabase(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  assertAdminToken(getAdminToken(req));
  ensureSupabaseEnv();
  const active = await supabaseRequest("push_subscriptions?select=endpoint,zona,avisos,created_at,last_seen_at,error_count,last_error&activo=eq.true&order=created_at.desc&limit=5000");
  const logs = await supabaseRequest("push_logs?select=title,body,url,zona,aviso_tipo,categoria,enviados,fallidos,created_at&order=created_at.desc&limit=20").catch(() => []);
  const fallidos = await supabaseRequest("push_subscriptions?select=endpoint,zona,last_error,error_count,updated_at&error_count=gt.0&order=updated_at.desc&limit=20").catch(() => []);
  const porZona = { c: 0, i: 0, mat1: 0, mat4: 0 };
  const porAviso = { citaciones: 0, resultados: 0, tablas: 0, jornada: 0 };
  for (const row of active || []) {
    if (porZona[row.zona] !== undefined) porZona[row.zona] += 1;
    for (const aviso of Array.isArray(row.avisos) ? row.avisos : []) {
      if (porAviso[aviso] !== undefined) porAviso[aviso] += 1;
    }
  }
  return res.status(200).json({
    ok: true,
    totalActivos: Array.isArray(active) ? active.length : 0,
    porZona,
    porAviso,
    ultimasAltas: (active || []).slice(0, 12).map((row) => ({ ...row, endpoint: maskEndpoint(row.endpoint) })),
    ultimosEnvios: logs || [],
    fallidosRecientes: (fallidos || []).map((row) => ({ ...row, endpoint: maskEndpoint(row.endpoint) })),
  });
}

function pushDebugEnv(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  assertAdminToken(getAdminToken(req));
  return res.status(200).json(debugEnv());
}

async function pushSubscribe(req, res) {
  const subscription = cleanSubscription(req.body && req.body.subscription);
  if (!subscription) return res.status(400).json({ ok: false, error: "Suscripción inválida." });
  const now = new Date().toISOString();
  const file = await readJsonFile(PUSH_PATH, { subscriptions: [] });
  const data = normalizePush(file.data);
  const index = data.subscriptions.findIndex((item) => item.endpoint === subscription.endpoint);
  if (index >= 0) data.subscriptions[index] = { ...data.subscriptions[index], ...subscription, updated_at: now, valid: true };
  else data.subscriptions.push({ ...subscription, created_at: now, updated_at: now, valid: true });
  await writeJsonFile(PUSH_PATH, data, file.sha, "actualiza suscripciones push");
  recordMetric({ event: "push_subscribe_success" }, "actualiza metricas por push").catch(() => {});
  return res.status(200).json({ ok: true });
}

async function pushSend(req, res) {
  assertAdminToken(req.body && req.body.token);
  const title = sanitizeText(req.body && req.body.title, 80) || "Baby All Boys";
  const body = sanitizeText(req.body && req.body.body, 180);
  if (!body) return res.status(400).json({ ok: false, error: "Mensaje obligatorio." });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return res.status(500).json({ ok: false, error: "Faltan variables VAPID." });
  }

  const webpush = require("web-push");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const file = await readJsonFile(PUSH_PATH, { subscriptions: [] });
  const data = normalizePush(file.data);
  const payload = JSON.stringify({ title, body, icon: "/icons/icon-192.png", badge: "/icons/maskable-192.png", data: { url: normalizeUrl(req.body && req.body.url) } });
  let enviadas = 0, fallidas = 0, removidas = 0;
  const vigentes = [];
  for (const subscription of data.subscriptions) {
    if (!subscription || subscription.valid === false) continue;
    try {
      await webpush.sendNotification(subscription, payload);
      enviadas += 1;
      vigentes.push(subscription);
    } catch (error) {
      fallidas += 1;
      if (error.statusCode === 404 || error.statusCode === 410) removidas += 1;
      else vigentes.push(subscription);
    }
  }
  if (removidas) await writeJsonFile(PUSH_PATH, { subscriptions: vigentes }, file.sha, "limpia suscripciones push invalidas");
  return res.status(200).json({ ok: true, enviadas, fallidas, removidas });
}

function adminAuth(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  assertAdminToken(req.body && req.body.token);
  return res.status(200).json({ ok: true });
}

async function adminData(req, res) {
  assertAdminToken(req.body && req.body.token);
  const files = {
    reportes: [REPORTS_PATH, { reportes: [] }],
    metricas: [METRICS_PATH, { updated_at: null, totales: {}, por_dia: {}, zonas: {}, vistas: {} }],
    push: [PUSH_PATH, { subscriptions: [] }],
  };
  const entry = files[req.body && req.body.type];
  if (!entry) return res.status(400).json({ ok: false, error: "Tipo inválido." });
  const file = await readJsonFile(entry[0], entry[1]);
  return res.status(200).json({ ok: true, data: file.data });
}

module.exports = async function handler(req, res) {
  const route = routeFrom(req);
  try {
    if (route === "push-public-key") return pushPublicKey(req, res);
    if (route === "live") return await liveData(req, res);
    if (route === "push-subscribe-supabase") return await pushSubscribeSupabase(req, res);
    if (route === "push-unsubscribe-supabase") return await pushUnsubscribeSupabase(req, res);
    if (route === "push-send-supabase") return await pushSendSupabase(req, res);
    if (route === "push-stats-supabase") return await pushStatsSupabase(req, res);
    if (route === "push-debug-env") return pushDebugEnv(req, res);
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Metodo no permitido." });
    }
    if (route === "reportar-error") return await reportarError(req, res);
    if (route === "track-event") return await trackEvent(req, res);
    if (route === "push-subscribe") return await pushSubscribe(req, res);
    if (route === "push-send") return await pushSend(req, res);
    if (route === "admin-login") return adminAuth(req, res);
    if (route === "admin-data") return await adminData(req, res);
    return res.status(404).json({ ok: false, error: "Ruta no encontrada." });
  } catch (error) {
    console.error("pwa", route, error);
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message || "Error interno." });
  }
};

module.exports._private = { buildLivePayload, cleanSubscription, normalizeLive, normalizeUrl, routeFrom };
