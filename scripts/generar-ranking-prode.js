"use strict";

const fs = require("fs");
const path = require("path");

const rankingEngine = require("../js/prode-ranking-engine.js");
const sheetsAdapter = require("../js/prode-sheets-adapter.js");

const OUTPUT_PATH = path.join(__dirname, "..", "data", "prode", "ranking.json");

const MOCK_SHEETS_DATA = {
  participantes: [
    [
      "submission_id",
      "timestamp",
      "nombre",
      "apellido",
      "nombre_hijo",
      "apellido_hijo",
      "numero_socio",
      "categoria",
      "tira",
      "whatsapp",
      "user_agent"
    ],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "Martin", "Aguirre", "Tomi", "Aguirre", "1001", "2016", "All Boys A", "1100000001", "mock-agent"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "Carla", "Benitez", "Valen", "Benitez", "1002", "2016", "All Boys B", "1100000002", "mock-agent"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "Diego", "Pereyra", "Lucho", "Pereyra", "1003", "2015", "All Boys A", "1100000003", "mock-agent"]
  ],
  pronosticos: [
    ["submission_id", "timestamp", "partido_id", "equipo_local", "equipo_visitante", "sign"],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "M001", "Mexico", "South Africa", "LOCAL"],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "M002", "South Korea", "Czechia", "EMPATE"],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "M003", "Canada", "Haiti", "VISITANTE"],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "M004", "United States", "Morocco", "LOCAL"],
    ["SUB-001", "2026-06-04T18:00:00.000Z", "M005", "Australia", "Turkey", "VISITANTE"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "M001", "Mexico", "South Africa", "LOCAL"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "M002", "South Korea", "Czechia", "EMPATE"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "M003", "Canada", "Haiti", "LOCAL"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "M004", "United States", "Morocco", "LOCAL"],
    ["SUB-002", "2026-06-04T18:01:00.000Z", "M005", "Australia", "Turkey", "VISITANTE"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "M001", "Mexico", "South Africa", "LOCAL"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "M002", "South Korea", "Czechia", "EMPATE"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "M003", "Canada", "Haiti", "VISITANTE"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "M004", "United States", "Morocco", "VISITANTE"],
    ["SUB-003", "2026-06-04T18:02:00.000Z", "M005", "Australia", "Turkey", "VISITANTE"]
  ],
  resultados: [
    ["partido_id", "sign"],
    ["M001", "LOCAL"],
    ["M002", "EMPATE"],
    ["M003", "VISITANTE"],
    ["M004", "LOCAL"],
    ["M005", "VISITANTE"]
  ]
};

function compareRankingRows(a, b) {
  return (
    b.puntos - a.puntos ||
    b.aciertos - a.aciertos ||
    a.errores - b.errores ||
    String(a.apellido_hijo || "").localeCompare(String(b.apellido_hijo || ""), "es") ||
    String(a.nombre_hijo || "").localeCompare(String(b.nombre_hijo || ""), "es")
  );
}

function assignPositions(rows) {
  let previous = null;
  return rows.map((row, index) => {
    const tied = previous &&
      previous.puntos === row.puntos &&
      previous.aciertos === row.aciertos &&
      previous.errores === row.errores;
    const posicion = tied ? previous.posicion : index + 1;
    const ranked = { ...row, posicion };
    previous = ranked;
    return ranked;
  });
}

function toRankingRow(score) {
  return {
    submission_id: score.submission_id,
    nombre_hijo: score.nombre_hijo,
    apellido_hijo: score.apellido_hijo,
    categoria: score.categoria,
    tira: score.tira,
    puntos: score.puntos,
    aciertos: score.aciertos,
    errores: score.errores,
    pendientes: score.pendientes
  };
}

function groupRanking(rows, field, fallbackLabel) {
  const grouped = rows.reduce((acc, row) => {
    const groupName = String(row?.[field] || "").trim() || fallbackLabel;
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(row);
    return acc;
  }, {});

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b, "es"))
    .reduce((acc, groupName) => {
      const ordered = grouped[groupName]
        .slice()
        .sort(compareRankingRows);
      acc[groupName] = assignPositions(ordered);
      return acc;
    }, {});
}

function generateRankingPayload(dataSources) {
  const participantes = sheetsAdapter.readParticipantes(dataSources.participantes);
  const pronosticos = sheetsAdapter.readPronosticos(dataSources.pronosticos);
  const resultados = sheetsAdapter.readResultados(dataSources.resultados);
  const pronosticosBySubmission = sheetsAdapter.buildPronosticosBySubmission(pronosticos);

  const scores = participantes
    .map(participante => rankingEngine.calculateSubmissionScore(participante, resultados, pronosticosBySubmission))
    .map(toRankingRow)
    .sort(compareRankingRows);

  const rankingGeneral = assignPositions(scores);
  const rankingPorCategoria = groupRanking(rankingGeneral, "categoria", "Sin categoria");
  const rankingPorTira = groupRanking(rankingGeneral, "tira", "Sin tira");

  return {
    generated_at: new Date().toISOString(),
    total_participantes: participantes.length,
    total_pronosticos: pronosticos.length,
    ranking_general: rankingGeneral,
    ranking_por_categoria: rankingPorCategoria,
    ranking_por_tira: rankingPorTira
  };
}

function writeRankingJson(dataSources) {
  const payload = generateRankingPayload(dataSources || MOCK_SHEETS_DATA);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return payload;
}

if (require.main === module) {
  writeRankingJson(MOCK_SHEETS_DATA);
}

module.exports = {
  MOCK_SHEETS_DATA,
  generateRankingPayload,
  writeRankingJson
};
