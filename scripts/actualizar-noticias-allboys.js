const path = require("path");
const { fetchText, persistJson, writeJsonLocal, decodeEntities } = require("./prode-automation-utils");

const NOTICIAS_PATH = path.join("data", "noticias-allboys.json");
const SOURCE_URL = "https://caallboys.com.ar/actualidad/";

function slugFromUrl(url) {
  return String(url || "").replace(/\/$/, "").split("/").pop() || "";
}

function resumen(titulo) {
  return `Nota oficial publicada por el Club Atletico All Boys: ${titulo}.`;
}

function extraerNoticias(html) {
  const matches = [...html.matchAll(/<h[23][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi)];
  const vistos = new Set();
  const noticias = [];
  for (const match of matches) {
    const url = match[1];
    if (!url || vistos.has(url) || !url.startsWith("https://caallboys.com.ar/20")) continue;
    vistos.add(url);
    const titulo = decodeEntities(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const slice = html.slice(Math.max(0, match.index - 300), match.index + 900);
    const dateMatch = slice.match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/) || [];
    const dia = dateMatch[1] || url.match(/\/2026\/([0-9]{2})\/([0-9]{2})\//)?.[2] || "01";
    const mes = dateMatch[2] || url.match(/\/2026\/([0-9]{2})\/([0-9]{2})\//)?.[1] || "01";
    const anio = dateMatch[3] || "2026";
    noticias.push({
      id: noticias.length + 1,
      fecha: `${anio}-${mes}-${dia}`,
      titulo,
      resumen: resumen(titulo),
      fuente: "Club Atletico All Boys",
      url,
      imagen: ""
    });
    if (noticias.length >= 4) break;
  }

  if (noticias.length) return noticias;

  const fallback = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{12,120})<\/a>/gi)]
    .map(m => ({ url: m[1], titulo: decodeEntities(m[2].trim()) }))
    .filter(x => x.url.startsWith("https://caallboys.com.ar/") && !["Actualidad", "Hacete socio"].includes(x.titulo))
    .slice(0, 4);

  return fallback.map((item, index) => ({
    id: index + 1,
    fecha: new Date().toISOString().slice(0, 10),
    titulo: item.titulo,
    resumen: resumen(item.titulo),
    fuente: "Club Atletico All Boys",
    url: item.url,
    imagen: ""
  }));
}

async function actualizarNoticiasAllBoys({ persist = true } = {}) {
  const html = await fetchText(SOURCE_URL, {
    headers: { "User-Agent": "baby-allboys-test" }
  });
  const noticias = extraerNoticias(html);
  if (!noticias.length) {
    return { ok: true, updated: 0, source: SOURCE_URL, message: "No se encontraron noticias nuevas." };
  }

  if (persist) {
    await persistJson({
      filePath: NOTICIAS_PATH,
      data: noticias,
      message: "actualizar noticias all boys"
    });
  } else {
    writeJsonLocal(NOTICIAS_PATH, noticias);
  }

  return { ok: true, updated: noticias.length, source: SOURCE_URL };
}

if (require.main === module) {
  actualizarNoticiasAllBoys({ persist: false })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { actualizarNoticiasAllBoys };
