const { readJsonFile, writeJsonFile, sanitizeText } = require("./github");

const METRICS_PATH = "data/admin/metricas.json";
const ALLOWED_EVENTS = new Set([
  "app_open",
  "pwa_install_prompt_shown",
  "pwa_install_accepted",
  "pwa_install_dismissed",
  "pwa_appinstalled",
  "push_subscribe_success",
  "push_subscribe_denied",
  "report_error_sent",
  "view_fixture",
  "view_resultados",
  "view_tablas",
  "view_reglamento",
  "zona_change",
]);
const ALLOWED_ZONES = new Set(["c", "i", "mat1", "mat4"]);
const ALLOWED_VIEWS = new Set(["fixture", "resultados", "tablas", "ranking", "reglamento"]);

function emptyMetrics() {
  return {
    updated_at: null,
    totales: {},
    por_dia: {},
    zonas: { c: 0, i: 0, mat1: 0, mat4: 0 },
    vistas: { fixture: 0, resultados: 0, tablas: 0, ranking: 0, reglamento: 0 },
  };
}

function normalizeMetrics(data) {
  const out = data && typeof data === "object" && !Array.isArray(data) ? data : emptyMetrics();
  out.totales = out.totales && typeof out.totales === "object" ? out.totales : {};
  out.por_dia = out.por_dia && typeof out.por_dia === "object" ? out.por_dia : {};
  out.zonas = { ...emptyMetrics().zonas, ...(out.zonas || {}) };
  out.vistas = { ...emptyMetrics().vistas, ...(out.vistas || {}) };
  return out;
}

async function recordMetric({ event, zona, vista, meta = {} }, message = "actualiza metricas baby allboys") {
  const cleanEvent = sanitizeText(event, 60);
  if (!ALLOWED_EVENTS.has(cleanEvent)) {
    const error = new Error("Evento no permitido.");
    error.statusCode = 400;
    throw error;
  }

  const cleanZona = ALLOWED_ZONES.has(zona) ? zona : "";
  const cleanVista = ALLOWED_VIEWS.has(vista) ? vista : "";
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const file = await readJsonFile(METRICS_PATH, emptyMetrics());
  const data = normalizeMetrics(file.data);

  data.updated_at = now.toISOString();
  data.totales[cleanEvent] = Number(data.totales[cleanEvent] || 0) + 1;
  data.por_dia[day] = data.por_dia[day] && typeof data.por_dia[day] === "object" ? data.por_dia[day] : {};
  data.por_dia[day][cleanEvent] = Number(data.por_dia[day][cleanEvent] || 0) + 1;

  if (cleanZona) data.zonas[cleanZona] = Number(data.zonas[cleanZona] || 0) + 1;
  if (cleanVista) data.vistas[cleanVista] = Number(data.vistas[cleanVista] || 0) + 1;

  if (meta && typeof meta === "object") {
    data.ultimo_evento = {
      event: cleanEvent,
      zona: cleanZona,
      vista: cleanVista,
      modo: sanitizeText(meta.modo || "", 40),
      at: data.updated_at,
    };
  }

  await writeJsonFile(METRICS_PATH, data, file.sha, message);
  return data;
}

module.exports = {
  ALLOWED_EVENTS,
  emptyMetrics,
  normalizeMetrics,
  recordMetric,
};
