(function initProdeSheetsAdapter(globalScope) {
  "use strict";

  const rankingEngine = typeof module !== "undefined" && module.exports
    ? require("./prode-ranking-engine.js")
    : globalScope.ProdeRankingEngine;

  function safeString(value) {
    return String(value || "").trim();
  }

  function normalizeSheetRecords(dataset) {
    if (!dataset) return [];

    if (Array.isArray(dataset?.rows)) {
      return normalizeSheetRecords(dataset.rows);
    }

    if (!Array.isArray(dataset)) return [];
    if (!dataset.length) return [];

    const firstRow = dataset[0];

    if (Array.isArray(firstRow)) {
      const headers = firstRow.map(header => safeString(header));
      return dataset
        .slice(1)
        .filter(row => Array.isArray(row) && row.some(cell => safeString(cell)))
        .map(row => headers.reduce((record, header, index) => {
          record[header] = row[index];
          return record;
        }, {}));
    }

    if (typeof firstRow === "object" && firstRow !== null) {
      return dataset
        .filter(row => row && typeof row === "object")
        .map(row => ({ ...row }));
    }

    return [];
  }

  function readParticipantes(dataset) {
    return normalizeSheetRecords(dataset).map(row => ({
      submission_id: safeString(row.submission_id),
      timestamp: safeString(row.timestamp),
      nombre: safeString(row.nombre),
      apellido: safeString(row.apellido),
      nombre_hijo: safeString(row.nombre_hijo),
      apellido_hijo: safeString(row.apellido_hijo),
      numero_socio: safeString(row.numero_socio),
      categoria: safeString(row.categoria),
      tira: safeString(row.tira),
      whatsapp: safeString(row.whatsapp),
      user_agent: safeString(row.user_agent)
    })).filter(row => row.submission_id);
  }

  function readPronosticos(dataset) {
    return normalizeSheetRecords(dataset).map(row => ({
      submission_id: safeString(row.submission_id),
      timestamp: safeString(row.timestamp),
      partido_id: safeString(row.partido_id),
      equipo_local: safeString(row.equipo_local),
      equipo_visitante: safeString(row.equipo_visitante),
      sign: rankingEngine.normalizeSign(row.sign)
    })).filter(row => row.submission_id && row.partido_id);
  }

  function readResultados(dataset) {
    return normalizeSheetRecords(dataset).reduce((acc, row) => {
      const partidoId = safeString(row.partido_id);
      const sign = rankingEngine.normalizeSign(row.sign);
      if (partidoId && sign) {
        acc[partidoId] = sign;
      }
      return acc;
    }, {});
  }

  function buildPronosticosBySubmission(pronosticos) {
    return (Array.isArray(pronosticos) ? pronosticos : []).reduce((acc, row) => {
      const submissionId = safeString(row?.submission_id);
      if (!submissionId) return acc;
      if (!acc[submissionId]) acc[submissionId] = [];
      acc[submissionId].push({
        partido_id: safeString(row.partido_id),
        equipo_local: safeString(row.equipo_local),
        equipo_visitante: safeString(row.equipo_visitante),
        sign: rankingEngine.normalizeSign(row.sign)
      });
      return acc;
    }, {});
  }

  const api = {
    readParticipantes,
    readPronosticos,
    readResultados,
    buildPronosticosBySubmission
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.ProdeSheetsAdapter = api;
})(typeof window !== "undefined" ? window : globalThis);
