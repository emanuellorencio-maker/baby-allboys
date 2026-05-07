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
  eq,
} = require("../lib/supabase-push");

const REPORTS_PATH = "data/admin/reportes.json";
const METRICS_PATH = "data/admin/metricas.json";
const PUSH_PATH = "data/admin/push-subscriptions.json";
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
  const body = req.body || {};
  await recordMetric({
    event: sanitizeText(body.event, 60),
    zona: sanitizeText(body.zona, 16),
    vista: sanitizeText(body.vista, 32),
    meta: { modo: sanitizeText(body.modo, 40) },
  });
  return res.status(200).json({ ok: true });
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
    if (route === "push-subscribe-supabase") return await pushSubscribeSupabase(req, res);
    if (route === "push-unsubscribe-supabase") return await pushUnsubscribeSupabase(req, res);
    if (route === "push-send-supabase") return await pushSendSupabase(req, res);
    if (route === "push-stats-supabase") return await pushStatsSupabase(req, res);
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Metodo no permitido." });
    }
    if (route === "reportar-error") return await reportarError(req, res);
    if (route === "track-event") return await trackEvent(req, res);
    if (route === "push-subscribe") return await pushSubscribe(req, res);
    if (route === "push-send") return await pushSend(req, res);
    if (route === "admin-data") return await adminData(req, res);
    return res.status(404).json({ ok: false, error: "Ruta no encontrada." });
  } catch (error) {
    console.error("pwa", route, error);
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message || "Error interno." });
  }
};

module.exports._private = { routeFrom, cleanSubscription, normalizeUrl };
