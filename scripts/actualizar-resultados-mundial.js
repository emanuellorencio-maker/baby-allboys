const path = require("path");
const { readJson, fetchJson, persistJson, writeJsonLocal } = require("./prode-automation-utils");

const PARTIDOS_PATH = path.join("data", "prode", "partidos.json");

function mapApiFixtureToMatch(apiFixture, partidos) {
  const home = apiFixture.teams?.home?.name;
  const away = apiFixture.teams?.away?.name;
  const date = apiFixture.fixture?.date?.slice(0, 10);
  return partidos.find(p => p.fecha === date && p.equipo_local === home && p.equipo_visitante === away);
}

async function actualizarResultadosMundial({ persist = true } = {}) {
  const partidos = readJson(PARTIDOS_PATH, []);
  if (!Array.isArray(partidos) || !partidos.length) {
    throw new Error("No hay partidos cargados.");
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { ok: true, updated: 0, source: "manual", message: "Sin API_FOOTBALL_KEY: se mantiene partidos.json manual." };
  }

  const url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
  const data = await fetchJson(url, {
    headers: {
      "x-apisports-key": apiKey
    }
  });

  let updated = 0;
  for (const fixture of data.response || []) {
    const match = mapApiFixtureToMatch(fixture, partidos);
    if (!match) continue;
    const status = fixture.fixture?.status?.short;
    const homeGoals = fixture.goals?.home;
    const awayGoals = fixture.goals?.away;
    if (status === "FT" && Number.isFinite(homeGoals) && Number.isFinite(awayGoals)) {
      match.resultado_real = { goles_local: homeGoals, goles_visitante: awayGoals };
      match.estado = "finalizado";
      match.fuente_resultado = "API-Football";
      updated++;
    }
  }

  if (persist && updated > 0) {
    await persistJson({
      filePath: PARTIDOS_PATH,
      data: partidos,
      message: "actualizar resultados mundial 2026"
    });
  } else if (!persist && updated > 0) {
    writeJsonLocal(PARTIDOS_PATH, partidos);
  }

  return { ok: true, updated, source: "API-Football" };
}

if (require.main === module) {
  actualizarResultadosMundial({ persist: false })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { actualizarResultadosMundial };
