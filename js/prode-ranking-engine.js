(function initProdeRankingEngine(globalScope) {
  "use strict";

  function safeString(value) {
    return String(value || "").trim();
  }

  function normalizeSign(value) {
    const raw = safeString(value).toUpperCase();
    if (raw === "LOCAL" || raw === "EMPATE" || raw === "VISITANTE") return raw;
    if (raw === "L") return "LOCAL";
    if (raw === "E") return "EMPATE";
    if (raw === "V") return "VISITANTE";
    return "";
  }

  function deriveSignFromLegacyGoals(localGoals, visitorGoals) {
    const gl = Number(localGoals);
    const gv = Number(visitorGoals);
    if (!Number.isFinite(gl) || !Number.isFinite(gv)) return "";
    if (gl > gv) return "LOCAL";
    if (gl < gv) return "VISITANTE";
    return "EMPATE";
  }

  function resolvePredictionSign(prediction) {
    return normalizeSign(prediction?.sign) || deriveSignFromLegacyGoals(prediction?.goles_local, prediction?.goles_visitante);
  }

  function resolveParticipantSubmissionId(participant) {
    return safeString(participant?.submission_id || participant?.id);
  }

  function resolveParticipantPredictions(participant, pronosticosBySubmission) {
    if (Array.isArray(participant?.pronosticos)) return participant.pronosticos;
    if (!pronosticosBySubmission || typeof pronosticosBySubmission !== "object") return [];
    const submissionId = resolveParticipantSubmissionId(participant);
    const bySubmission = pronosticosBySubmission[submissionId];
    return Array.isArray(bySubmission) ? bySubmission : [];
  }

  function compareParticipants(a, b) {
    return (
      b.puntos - a.puntos ||
      b.aciertos - a.aciertos ||
      a.pendientes - b.pendientes ||
      safeString(a.apellido_hijo).localeCompare(safeString(b.apellido_hijo), "es") ||
      safeString(a.nombre_hijo).localeCompare(safeString(b.nombre_hijo), "es") ||
      safeString(a.tira).localeCompare(safeString(b.tira), "es")
    );
  }

  function calculateSubmissionScore(participant, resultadosOficiales, pronosticosBySubmission) {
    const predictions = resolveParticipantPredictions(participant, pronosticosBySubmission);
    const normalizedResults = resultadosOficiales && typeof resultadosOficiales === "object" ? resultadosOficiales : {};

    const detalle = predictions.map(prediction => {
      const partidoId = safeString(prediction?.partido_id);
      const predictionSign = resolvePredictionSign(prediction);
      const resultSign = normalizeSign(normalizedResults[partidoId]);

      if (!predictionSign || !resultSign) {
        return {
          partido_id: partidoId,
          sign: predictionSign,
          resultado: resultSign,
          puntos: 0,
          estado: "pendiente"
        };
      }

      if (predictionSign === resultSign) {
        return {
          partido_id: partidoId,
          sign: predictionSign,
          resultado: resultSign,
          puntos: 1,
          estado: "acierto"
        };
      }

      return {
        partido_id: partidoId,
        sign: predictionSign,
        resultado: resultSign,
        puntos: 0,
        estado: "error"
      };
    });

    const puntos = detalle.reduce((total, item) => total + item.puntos, 0);
    const aciertos = detalle.filter(item => item.estado === "acierto").length;
    const errores = detalle.filter(item => item.estado === "error").length;
    const pendientes = detalle.filter(item => item.estado === "pendiente").length;

    return {
      submission_id: resolveParticipantSubmissionId(participant),
      nombre: safeString(participant?.nombre),
      apellido: safeString(participant?.apellido),
      nombre_hijo: safeString(participant?.nombre_hijo || participant?.chico),
      apellido_hijo: safeString(participant?.apellido_hijo),
      categoria: safeString(participant?.categoria),
      tira: safeString(participant?.tira),
      puntos,
      aciertos,
      errores,
      pendientes,
      pronosticos_cargados: detalle.length,
      detalle
    };
  }

  function calculateRanking(participantes, resultadosOficiales, pronosticosBySubmission) {
    const rows = (Array.isArray(participantes) ? participantes : [])
      .map(participant => calculateSubmissionScore(participant, resultadosOficiales, pronosticosBySubmission))
      .sort(compareParticipants);

    let previous = null;
    return rows.map((row, index) => {
      const tied = previous &&
        previous.puntos === row.puntos &&
        previous.aciertos === row.aciertos &&
        previous.pendientes === row.pendientes;
      const puesto = tied ? previous.puesto : index + 1;
      const ranked = { ...row, puesto };
      previous = ranked;
      return ranked;
    });
  }

  function groupRankingByCategory(ranking) {
    return (Array.isArray(ranking) ? ranking : []).reduce((acc, row) => {
      const category = safeString(row?.categoria) || "Sin categoria";
      if (!acc[category]) acc[category] = [];
      acc[category].push(row);
      return acc;
    }, {});
  }

  const MOCK_RESULTS = {
    M001: "LOCAL",
    M002: "EMPATE",
    M003: "VISITANTE",
    M004: "LOCAL",
    M005: "VISITANTE"
  };

  const MOCK_PARTICIPANTS = [
    {
      submission_id: "TEST-001",
      nombre: "Martin",
      apellido: "Aguirre",
      nombre_hijo: "Tomi",
      apellido_hijo: "Aguirre",
      categoria: "2016",
      tira: "All Boys A",
      pronosticos: [
        { partido_id: "M001", sign: "LOCAL" },
        { partido_id: "M002", sign: "EMPATE" },
        { partido_id: "M003", sign: "VISITANTE" },
        { partido_id: "M004", sign: "LOCAL" },
        { partido_id: "M005", sign: "LOCAL" }
      ]
    },
    {
      submission_id: "TEST-002",
      nombre: "Carla",
      apellido: "Benitez",
      nombre_hijo: "Valen",
      apellido_hijo: "Benitez",
      categoria: "2016",
      tira: "All Boys B",
      pronosticos: [
        { partido_id: "M001", sign: "LOCAL" },
        { partido_id: "M002", sign: "EMPATE" },
        { partido_id: "M003", sign: "LOCAL" },
        { partido_id: "M004", sign: "LOCAL" },
        { partido_id: "M005", sign: "VISITANTE" }
      ]
    },
    {
      submission_id: "TEST-003",
      nombre: "Diego",
      apellido: "Pereyra",
      nombre_hijo: "Lucho",
      apellido_hijo: "Pereyra",
      categoria: "2015",
      tira: "All Boys A",
      pronosticos: [
        { partido_id: "M001", sign: "LOCAL" },
        { partido_id: "M002", sign: "EMPATE" },
        { partido_id: "M003", sign: "VISITANTE" },
        { partido_id: "M004", sign: "VISITANTE" },
        { partido_id: "M005", sign: "VISITANTE" }
      ]
    }
  ];

  function getMockScenario() {
    const ranking = calculateRanking(MOCK_PARTICIPANTS, MOCK_RESULTS);
    return {
      participantes: MOCK_PARTICIPANTS,
      resultados: MOCK_RESULTS,
      ranking,
      rankingPorCategoria: groupRankingByCategory(ranking)
    };
  }

  const api = {
    normalizeSign,
    calculateSubmissionScore,
    calculateRanking,
    groupRankingByCategory,
    getMockScenario
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.ProdeRankingEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
