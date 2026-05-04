const { sanitizeText } = require("../lib/github");
const { recordMetric } = require("../lib/metrics");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  try {
    const body = req.body || {};
    await recordMetric({
      event: sanitizeText(body.event, 60),
      zona: sanitizeText(body.zona, 16),
      vista: sanitizeText(body.vista, 32),
      meta: {
        modo: sanitizeText(body.modo, 40),
      },
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.warn("track-event", error.message);
    return res.status(error.statusCode || 200).json({ ok: error.statusCode ? false : true, error: error.statusCode ? error.message : undefined });
  }
};
