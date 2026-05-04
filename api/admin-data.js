const { assertAdminToken, readJsonFile } = require("./_github");

const FILES = {
  reportes: ["data/admin/reportes.json", { reportes: [] }],
  metricas: ["data/admin/metricas.json", { updated_at: null, totales: {}, por_dia: {}, zonas: {}, vistas: {} }],
  push: ["data/admin/push-subscriptions.json", { subscriptions: [] }],
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  try {
    assertAdminToken(req.body && req.body.token);
    const type = req.body && req.body.type;
    if (!FILES[type]) return res.status(400).json({ ok: false, error: "Tipo inválido." });
    const [path, fallback] = FILES[type];
    const file = await readJsonFile(path, fallback);
    return res.status(200).json({ ok: true, data: file.data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message });
  }
};
