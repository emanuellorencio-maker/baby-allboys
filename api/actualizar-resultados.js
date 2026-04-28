const { actualizarResultadosMundial } = require("../scripts/actualizar-resultados-mundial");

module.exports = async function handler(req, res) {
  try {
    const result = await actualizarResultadosMundial({ persist: true });
    res.status(200).json(result);
  } catch (error) {
    console.error("actualizar-resultados", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
