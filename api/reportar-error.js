const { readJsonFile, writeJsonFile, sanitizeText } = require("./_github");
const { recordMetric } = require("./_metrics");

const REPORTS_PATH = "data/admin/reportes.json";
const TIPOS = new Set([
  "Resultado mal cargado",
  "Fixture incorrecto",
  "Tabla incorrecta",
  "Horario/dirección incorrecta",
  "Otro",
]);

function emptyReports() {
  return { reportes: [] };
}

function normalizeReports(data) {
  return {
    reportes: Array.isArray(data && data.reportes) ? data.reportes : [],
  };
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  try {
    const body = req.body || {};
    const comentario = sanitizeText(body.comentario, 500);
    const tipo = TIPOS.has(body.tipo) ? body.tipo : "Otro";

    if (comentario.length < 5) {
      return res.status(400).json({ ok: false, error: "El comentario debe tener al menos 5 caracteres." });
    }
    if (String(body.comentario || "").length > 600) {
      return res.status(400).json({ ok: false, error: "El comentario es demasiado largo." });
    }

    const file = await readJsonFile(REPORTS_PATH, emptyReports());
    const data = normalizeReports(file.data);
    const reporte = {
      id: makeId(),
      created_at: new Date().toISOString(),
      zona: sanitizeText(body.zona, 16),
      vista: sanitizeText(body.vista, 32),
      fecha: sanitizeText(body.fecha, 32),
      categoria: sanitizeText(body.categoria, 32),
      tipo,
      comentario,
      contacto: sanitizeText(body.contacto, 120),
      estado: "nuevo",
      userAgent: sanitizeText(req.headers["user-agent"], 160),
    };

    data.reportes.unshift(reporte);
    await writeJsonFile(REPORTS_PATH, data, file.sha, "agrega reporte de error");
    recordMetric({ event: "report_error_sent", zona: reporte.zona, vista: reporte.vista }, "actualiza metricas por reporte").catch((error) => {
      console.warn("No se pudo trackear reporte", error.message);
    });

    return res.status(200).json({ ok: true, reporte: { id: reporte.id } });
  } catch (error) {
    console.error("reportar-error", error);
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message || "No se pudo enviar el reporte." });
  }
};
