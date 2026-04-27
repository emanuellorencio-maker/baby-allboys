const { actualizarNoticiasAllBoys } = require("../scripts/actualizar-noticias-allboys");

module.exports = async function handler(req, res) {
  try {
    const result = await actualizarNoticiasAllBoys({ persist: true });
    res.status(200).json(result);
  } catch (error) {
    console.error("actualizar-noticias-allboys", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
