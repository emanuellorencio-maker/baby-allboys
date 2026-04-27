const path = require("path");
const { fetchJson, persistJson, writeJsonLocal } = require("./prode-automation-utils");

const NOTICIAS_PATH = path.join("data", "prode", "noticias-mundial.json");

function resumenPropio(item) {
  const text = String(item.description || item.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "Noticia del Mundial 2026 publicada por una fuente deportiva confiable.";
  return text.slice(0, 155).replace(/\s+\S*$/, "") + (text.length > 155 ? "..." : "");
}

async function actualizarNoticiasMundial({ persist = true } = {}) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return { ok: true, updated: 0, source: "manual", message: "Sin NEWS_API_KEY: se mantiene noticias-mundial.json manual." };
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent("FIFA World Cup 2026")}&language=es,en&pageSize=4&sortBy=publishedAt&apiKey=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  const noticias = (data.articles || []).slice(0, 4).map((item, index) => ({
    id: index + 1,
    fecha: (item.publishedAt || new Date().toISOString()).slice(0, 10),
    titulo: item.title || "Noticia Mundial 2026",
    resumen: resumenPropio(item),
    fuente: item.source?.name || "NewsAPI",
    url: item.url
  })).filter(n => n.url);

  if (noticias.length && persist) {
    await persistJson({
      filePath: NOTICIAS_PATH,
      data: noticias,
      message: "actualizar noticias mundial 2026"
    });
  } else if (noticias.length) {
    writeJsonLocal(NOTICIAS_PATH, noticias);
  }

  return { ok: true, updated: noticias.length, source: "NewsAPI" };
}

if (require.main === module) {
  actualizarNoticiasMundial({ persist: false })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { actualizarNoticiasMundial };
