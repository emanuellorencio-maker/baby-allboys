const fs = require("fs");
const path = require("path");
const { assertAdminToken, readJsonFile, writeJsonFile, sanitizeText } = require("../lib/github");

const LIVE_PATH = "live.json";
const LOCAL_LIVE_PATH = path.join(process.cwd(), LIVE_PATH);
let liveCache = { at: 0, data: null };
const ZONAS = new Set(["c", "i", "mat1", "mat4"]);
const ESTADOS = new Set(["Previa", "Primer Tiempo", "Entretiempo", "Segundo Tiempo", "Finalizado"]);
const CATEGORIAS = {
  c: ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
  i: ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
  mat1: ["2013", "2014/15", "2016/17", "2018/19", "2020/21/22"],
  mat4: ["2013", "2014", "2015", "2016", "2017", "2018/19/20"],
};

const DEFAULT_LIVE = {
  activo: false,
  zona: "",
  categoria: "",
  fecha: "",
  estado: "Previa",
  minuto: 0,
  local: "",
  visitante: "",
  condicion: "",
  goles_local: 0,
  goles_visitante: 0,
  updated_at: null,
};

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(body);
}

function clampInt(value, min, max) {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function cleanZona(value) {
  const zona = String(value || "").trim().toLowerCase();
  return ZONAS.has(zona) ? zona : "";
}

function cleanEstado(value) {
  const estado = sanitizeText(value, 40);
  return ESTADOS.has(estado) ? estado : "Previa";
}

function cleanCategoria(zona, value) {
  const categoria = sanitizeText(value, 20);
  return (CATEGORIAS[zona] || []).includes(categoria) ? categoria : "";
}

function normalizeLive(data) {
  const raw = data && typeof data === "object" ? data : {};
  return {
    ...DEFAULT_LIVE,
    activo: raw.activo === true,
    zona: cleanZona(raw.zona),
    categoria: sanitizeText(raw.categoria, 20),
    fecha: sanitizeText(raw.fecha, 20),
    estado: cleanEstado(raw.estado),
    minuto: clampInt(raw.minuto, 0, 80),
    local: sanitizeText(raw.local, 90),
    visitante: sanitizeText(raw.visitante, 90),
    condicion: sanitizeText(raw.condicion, 30),
    goles_local: clampInt(raw.goles_local, 0, 99),
    goles_visitante: clampInt(raw.goles_visitante, 0, 99),
    updated_at: sanitizeText(raw.updated_at, 40) || null,
  };
}

function readLocalLive() {
  try {
    return normalizeLive(JSON.parse(fs.readFileSync(LOCAL_LIVE_PATH, "utf8")));
  } catch (error) {
    return { ...DEFAULT_LIVE };
  }
}

function readFixture(zona) {
  const fixturePath = path.join(process.cwd(), "data", zona, "fixture.json");
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function findFixture(zona, fecha) {
  const fixture = readFixture(zona);
  return (Array.isArray(fixture) ? fixture : []).find((partido) => String(partido.fecha_id || "") === fecha) || null;
}

async function readLive() {
  if (liveCache.data && Date.now() - liveCache.at < 12000) {
    return { data: liveCache.data, sha: null };
  }
  try {
    const file = await readJsonFile(LIVE_PATH, DEFAULT_LIVE);
    const data = normalizeLive(file.data);
    liveCache = { at: Date.now(), data };
    return { data, sha: file.sha };
  } catch (error) {
    const data = readLocalLive();
    liveCache = { at: Date.now(), data };
    return { data, sha: null };
  }
}

function buildLivePayload(body) {
  const zona = cleanZona(body && body.zona);
  if (!zona) {
    const error = new Error("Zona invalida.");
    error.statusCode = 400;
    throw error;
  }

  const fecha = sanitizeText(body && body.fecha, 20);
  const categoria = cleanCategoria(zona, body && body.categoria);
  if (!fecha || !categoria) {
    const error = new Error("Fecha o categoria invalida.");
    error.statusCode = 400;
    throw error;
  }

  const partido = findFixture(zona, fecha);
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

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const live = await readLive();
      return json(res, 200, { ok: true, live: live.data });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return json(res, 405, { ok: false, error: "Metodo no permitido." });
    }

    assertAdminToken(req.body && req.body.token);
    const current = await readJsonFile(LIVE_PATH, DEFAULT_LIVE);
    const live = buildLivePayload(req.body || {});
    await writeJsonFile(LIVE_PATH, live, current.sha, "actualiza jornada en vivo");
    liveCache = { at: Date.now(), data: live };
    return json(res, 200, { ok: true, live });
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, error: error.message || "Error interno." });
  }
};

module.exports._private = {
  buildLivePayload,
  cleanCategoria,
  cleanEstado,
  cleanZona,
  normalizeLive,
};
