const { google } = require("googleapis");

const RESULTADO_COLUMN = "I";
const READ_RANGE = "E:K";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[."']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeTeam(value) {
  return normalizeText(value)
    .replace(/\b(CLUB|C A|C S|C S Y D|CSD|FC|F C|ATLETICO|AT)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDivision(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function fechaNumero(value) {
  const match = String(value || "").match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

function zonaSheet(zona) {
  const key = normalizeText(zona);
  if (key === "C") return "C";
  if (key === "I") return "I";
  if (key === "MAT1") return "MAT1";
  if (key === "MAT4") return "MAT4";
  return key;
}

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function isFilledResult(result) {
  return Boolean(result && (result.local !== null || result.visitante !== null));
}

function formatResult(result) {
  const local = normalizeText(result && result.local);
  const visitante = normalizeText(result && result.visitante);
  if (/^\d+$/.test(local) && /^\d+$/.test(visitante)) return `${local} - ${visitante}`;
  if (local && visitante && local !== visitante) return `${local} - ${visitante}`;
  return local || visitante || "";
}

function teamMatches(sheetValue, payloadValue) {
  const sheet = normalizeTeam(sheetValue);
  const payload = normalizeTeam(payloadValue);
  if (!sheet || !payload) return null;
  if (sheet === payload) return true;
  if (sheet === "ALL BOYS" && payload.includes("ALL BOYS")) return true;
  if (payload === "ALL BOYS" && sheet.includes("ALL BOYS")) return true;
  if (sheet.length >= 5 && payload.includes(sheet)) return true;
  if (payload.length >= 5 && sheet.includes(payload)) return true;
  return false;
}

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON.");

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (error) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no es JSON valido.");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no tiene client_email/private_key.");
  }

  return credentials;
}

async function getSheetsClient() {
  const credentials = parseServiceAccount();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}

function rowsFromSheet(sheetTitle, values) {
  let currentZona = "";
  let currentFecha = "";

  return values.slice(1).map((row, index) => {
    const zona = row[0] || currentZona;
    const fecha = row[1] || currentFecha;
    if (row[0]) currentZona = row[0];
    if (row[1]) currentFecha = row[1];

    return {
      sheetTitle,
      rowNumber: index + 2,
      zona: zonaSheet(zona),
      fecha: fechaNumero(fecha),
      division: normalizeDivision(row[2]),
      local: row[3] || "",
      resultado: row[4] || "",
      visitante: row[6] || "",
    };
  });
}

function chooseCandidate(candidates, partido) {
  const withTeamCheck = candidates.map((candidate) => {
    const localOk = teamMatches(candidate.local, partido.local);
    const visitanteOk = teamMatches(candidate.visitante, partido.visitante);
    const comparable = localOk !== null && visitanteOk !== null;
    return {
      candidate,
      comparable,
      exactTeams: comparable && localOk && visitanteOk,
    };
  });

  const exact = withTeamCheck.filter((item) => item.exactTeams).map((item) => item.candidate);
  if (exact.length === 1) return { candidate: exact[0], warning: null };
  if (exact.length > 1) return { candidate: null, warning: "match duplicado con LOCAL/VISITANTE coincidentes" };

  if (candidates.length === 1) {
    return {
      candidate: candidates[0],
      warning: "LOCAL/VISITANTE no coincidieron exactamente; se uso match unico por ZONA + FECHA + DIVISION",
    };
  }

  return { candidate: null, warning: "match ambiguo por ZONA + FECHA + DIVISION" };
}

async function actualizarResultadosEnSheet({ zona, fechaId, partido }) {
  const warnings = [];
  const errors = [];
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return { ok: false, updated: 0, warnings: ["Falta GOOGLE_SPREADSHEET_ID."], errors: [] };
  }

  const entries = Object.entries((partido && partido.resultados) || {}).filter(([, result]) => isFilledResult(result));
  if (!entries.length) return { ok: true, updated: 0, warnings: ["No hay resultados cargados para enviar a Sheets."] };

  try {
    const sheets = await getSheetsClient();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(title,hidden,sheetType))",
    });

    const visibleSheets = (metadata.data.sheets || [])
      .map((sheet) => sheet.properties)
      .filter((properties) => properties && properties.sheetType === "GRID" && !properties.hidden);

    const ranges = visibleSheets.map((sheet) => `${quoteSheetName(sheet.title)}!${READ_RANGE}`);
    if (!ranges.length) return { ok: false, updated: 0, warnings: ["No hay pestañas visibles para buscar resultados."], errors: [] };

    const read = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
      valueRenderOption: "FORMATTED_VALUE",
    });

    const allRows = [];
    (read.data.valueRanges || []).forEach((rangeData, index) => {
      allRows.push(...rowsFromSheet(visibleSheets[index].title, rangeData.values || []));
    });

    const targetZona = zonaSheet(zona);
    const targetFecha = fechaNumero(fechaId);
    const updates = [];

    entries.forEach(([division, result]) => {
      const targetDivision = normalizeDivision(division);
      const candidates = allRows.filter((row) => row.zona === targetZona && row.fecha === targetFecha && row.division === targetDivision);

      if (!candidates.length) {
        warnings.push(`No se encontro fila para zona ${targetZona}, fecha ${targetFecha}, division ${division}.`);
        return;
      }

      const selected = chooseCandidate(candidates, partido);
      if (selected.warning) warnings.push(`Division ${division}: ${selected.warning}.`);
      if (!selected.candidate) return;

      updates.push({
        range: `${quoteSheetName(selected.candidate.sheetTitle)}!${RESULTADO_COLUMN}${selected.candidate.rowNumber}`,
        values: [[formatResult(result)]],
      });
    });

    if (!updates.length) {
      return { ok: false, updated: 0, warnings: warnings.length ? warnings : ["No hubo filas seguras para actualizar."], errors };
    }

    const write = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return {
      ok: true,
      updated: write.data.totalUpdatedCells || updates.length,
      warnings,
      errors,
    };
  } catch (error) {
    errors.push(error && error.message ? error.message : "Error desconocido actualizando Google Sheets.");
    return { ok: false, updated: 0, warnings, errors };
  }
}

module.exports = {
  actualizarResultadosEnSheet,
  _private: {
    fechaNumero,
    formatResult,
    normalizeDivision,
    normalizeTeam,
    normalizeText,
    rowsFromSheet,
    teamMatches,
    zonaSheet,
  },
};
