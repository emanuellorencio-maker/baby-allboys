const { actualizarNoticiasMundial } = require("../scripts/actualizar-noticias-mundial");

module.exports = async function handler(req, res) {
  try {
    const result = await actualizarNoticiasMundial({ persist: true });
    res.status(200).json(result);
  } catch (error) {
    console.error("actualizar-noticias-mundial", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
