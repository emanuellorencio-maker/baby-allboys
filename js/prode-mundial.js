const CATEGORIAS = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"];
const TIRAS = ["All Boys A", "All Boys B", "Los Albos", "All Boys"];
const INSTANCIAS = ["Grupos", "32avos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];
const DOMINIOS_NOTICIAS = new Set(["fifa.com", "www.fifa.com", "inside.fifa.com"]);
const PRODE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbz1Vu2DhG0X8ZvgnSlL86i-j_ODhXTuod4cujysuaNyNHCb7pC4K1TGoETDQJECXMnS/exec";
const PRODE_CIERRE_ISO = "";
const MUNDIAL_INICIO_ISO = "2026-06-11T00:00:00-03:00";
const PRODE_SUBMISSION_VERSION = "fase-2-google-sheets";
const PRODE_DRAFT_STORAGE_KEY = "prode26_allboys_draft_v1";
const PRODE_DRAFT_DEBOUNCE_MS = 250;
const COUNTRY_CODES = {
  argentina: "AR",
  brasil: "BR",
  brazil: "BR",
  uruguay: "UY",
  paraguay: "PY",
  colombia: "CO",
  ecuador: "EC",
  chile: "CL",
  peru: "PE",
  venezuela: "VE",
  bolivia: "BO",
  mexico: "MX",
  estadosunidos: "US",
  unitedstates: "US",
  usa: "US",
  canada: "CA",
  costarica: "CR",
  panama: "PA",
  honduras: "HN",
  jamaica: "JM",
  haiti: "HT",
  curacao: "CW",
  curazao: "CW",
  republicadominicana: "DO",
  dominicanrepublic: "DO",
  elsalvador: "SV",
  guatemala: "GT",
  trinidadytobago: "TT",
  trinidadandtobago: "TT",
  espana: "ES",
  spain: "ES",
  francia: "FR",
  france: "FR",
  alemania: "DE",
  germany: "DE",
  italia: "IT",
  italy: "IT",
  portugal: "PT",
  inglaterra: "GB",
  england: "GB",
  escocia: "GB",
  scotland: "GB",
  gales: "GB",
  wales: "GB",
  paisesbajos: "NL",
  netherlands: "NL",
  holanda: "NL",
  belgica: "BE",
  belgium: "BE",
  croacia: "HR",
  croatia: "HR",
  serbia: "RS",
  suiza: "CH",
  switzerland: "CH",
  austria: "AT",
  dinamarca: "DK",
  denmark: "DK",
  noruega: "NO",
  norway: "NO",
  suecia: "SE",
  sweden: "SE",
  polonia: "PL",
  poland: "PL",
  ucrania: "UA",
  ukraine: "UA",
  turquia: "TR",
  turkiye: "TR",
  trkiye: "TR",
  turkey: "TR",
  grecia: "GR",
  greece: "GR",
  republicacheca: "CZ",
  chequia: "CZ",
  czechrepublic: "CZ",
  czechia: "CZ",
  eslovaquia: "SK",
  slovakia: "SK",
  eslovenia: "SI",
  slovenia: "SI",
  hungria: "HU",
  hungary: "HU",
  rumania: "RO",
  romania: "RO",
  irlanda: "IE",
  ireland: "IE",
  irlandadelnorte: "GB",
  northernireland: "GB",
  islandia: "IS",
  iceland: "IS",
  albania: "AL",
  bosniayherzegovina: "BA",
  bosniaandherzegovina: "BA",
  georgia: "GE",
  marruecos: "MA",
  morocco: "MA",
  egipto: "EG",
  egypt: "EG",
  argelia: "DZ",
  algeria: "DZ",
  tunez: "TN",
  tunisia: "TN",
  senegal: "SN",
  nigeria: "NG",
  ghana: "GH",
  costademarfil: "CI",
  ivorycoast: "CI",
  coteivoire: "CI",
  camerun: "CM",
  cameroon: "CM",
  sudafrica: "ZA",
  southafrica: "ZA",
  caboverde: "CV",
  capeverde: "CV",
  japon: "JP",
  japan: "JP",
  coreadelsur: "KR",
  southkorea: "KR",
  korearepublic: "KR",
  australia: "AU",
  iran: "IR",
  arabiasaudita: "SA",
  saudiarabia: "SA",
  qatar: "QA",
  uzbekistan: "UZ",
  jordania: "JO",
  jordan: "JO",
  irak: "IQ",
  iraq: "IQ",
  congodr: "CD",
  rdcongo: "CD",
  drcongo: "CD",
  emiratosarabesunidos: "AE",
  unitedarabemirates: "AE",
  oman: "OM",
  nuevazelanda: "NZ",
  newzealand: "NZ",
  playoffeuropa: "UEFA",
  europeanplayoff: "UEFA",
  europeanplayoffa: "UEFA",
  europeanplayoffb: "UEFA",
  europeanplayoffc: "UEFA",
  europeanplayoffd: "UEFA",
  fifaplayoff1: "FIFA",
  fifaplayoff2: "FIFA",
  playoff1: "FIFA",
  playoff2: "FIFA",
  clasificacionpendiente: "FIFA",
  pendingqualification: "FIFA",
  pendiente: "FIFA",
  pordefinir: "FIFA",
  tbd: "FIFA"
};

const state = {
  participantes: [],
  partidos: [],
  ranking: [],
  vista: "general",
  busqueda: "",
  categoria: "",
  tira: "",
  grupo: "",
  fecha: "",
  instancia: "",
  seleccion: "",
  submission: {
    sending: false,
    submitted: false
  }
};

const DISPLAY_TEAM_NAMES = {
  mexico: "México",
  southafrica: "Sudáfrica",
  southkorea: "Corea del Sur",
  korearepublic: "Corea del Sur",
  czechia: "República Checa",
  czechrepublic: "República Checa",
  republicacheca: "República Checa",
  canada: "Canadá",
  bosniaandherzegovina: "Bosnia y Herzegovina",
  bosniayherzegovina: "Bosnia y Herzegovina",
  unitedstates: "Estados Unidos",
  estadosunidos: "Estados Unidos",
  haiti: "Haití",
  scotland: "Escocia",
  turkiye: "Turquía",
  turkey: "Turquía",
  trkiye: "Turquía",
  turquia: "Turquía",
  brazil: "Brasil",
  morocco: "Marruecos",
  switzerland: "Suiza",
  netherlands: "Países Bajos",
  japan: "Japón",
  sweden: "Suecia",
  tunisia: "Túnez",
  germany: "Alemania",
  curacao: "Curazao",
  curazao: "Curazao",
  coteivoire: "Costa de Marfil",
  ivorycoast: "Costa de Marfil",
  costademarfil: "Costa de Marfil",
  saudiarabia: "Arabia Saudita",
  spain: "España",
  capeverde: "Cabo Verde",
  iriran: "Irán",
  iran: "Irán",
  newzealand: "Nueva Zelanda",
  belgium: "Bélgica",
  egypt: "Egipto",
  france: "Francia",
  iraq: "Irak",
  norway: "Noruega",
  algeria: "Argelia",
  jordan: "Jordania",
  england: "Inglaterra",
  croatia: "Croacia",
  panama: "Panamá",
  uzbekistan: "Uzbekistán",
  mali: "Malí",
  congodr: "RD Congo",
  drcongo: "RD Congo",
  rdcongo: "RD Congo"
};

let countdownTimer = null;
let draftSaveTimer = null;

const $ = selector => document.querySelector(selector);
const byId = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, match => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[match]));
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const PREDICTION_SIGN_LABELS = {
  local: "LOCAL",
  empate: "EMPATE",
  visitante: "VISITANTE"
};

function normalizePredictionSign(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "local" || raw === "empate" || raw === "visitante") return raw;
  if (raw === "l") return "local";
  if (raw === "e") return "empate";
  if (raw === "v") return "visitante";
  return "";
}

function deriveSignFromGoals(localGoals, visitorGoals) {
  const gl = Number(localGoals);
  const gv = Number(visitorGoals);
  if (!Number.isFinite(gl) || !Number.isFinite(gv)) return "";
  if (gl > gv) return "local";
  if (gl < gv) return "visitante";
  return "empate";
}

function getPronosticoSign(pronostico = {}) {
  return normalizePredictionSign(pronostico.sign) || deriveSignFromGoals(pronostico.goles_local, pronostico.goles_visitante);
}

function predictionSignToGoals(sign) {
  const normalized = normalizePredictionSign(sign);
  if (normalized === "local") return { goles_local: 1, goles_visitante: 0 };
  if (normalized === "visitante") return { goles_local: 0, goles_visitante: 1 };
  return { goles_local: 0, goles_visitante: 0 };
}

function getPredictionSignInputs(partidoId) {
  return Array.from(document.querySelectorAll(`input[name="pred-sign-${CSS.escape(partidoId)}"]`));
}

function getSelectedPredictionSign(partidoId) {
  const selected = getPredictionSignInputs(partidoId).find(input => input.checked);
  return normalizePredictionSign(selected?.value || "");
}

function setSelectedPredictionSign(partidoId, sign) {
  const normalized = normalizePredictionSign(sign);
  getPredictionSignInputs(partidoId).forEach(input => {
    input.checked = input.value === normalized;
  });
}

function isDraftPage() {
  return Boolean(byId("prodeForm"));
}

function readDraftStorage() {
  if (!isDraftPage()) return null;
  try {
    const raw = window.localStorage.getItem(PRODE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function removeDraftStorage() {
  try {
    window.localStorage.removeItem(PRODE_DRAFT_STORAGE_KEY);
  } catch (error) {
    // no-op
  }
}

function setDraftNotice(message = "", type = "") {
  const node = byId("draftRestoreNotice");
  if (!node) return;
  if (!message) {
    node.textContent = "";
    node.className = "draft-restore-note oculto";
    return;
  }
  node.textContent = message;
  node.className = `draft-restore-note ${type}`.trim();
}

function collectDraftPredictionValues() {
  const pronosticos = {};
  state.partidos.forEach(partido => {
    const sign = getSelectedPredictionSign(partido.id);
    if (!sign) return;
    pronosticos[partido.id] = {
      sign
    };
  });
  return pronosticos;
}

function hasDraftContent(participante, pronosticos) {
  const hasParticipant = Object.values(participante || {}).some(value => String(value || "").trim() !== "");
  const hasPredictions = Object.values(pronosticos || {}).some(item => normalizePredictionSign(item?.sign || deriveSignFromGoals(item?.goles_local, item?.goles_visitante)));
  return hasParticipant || hasPredictions;
}

function saveDraftNow() {
  if (!isDraftPage()) return;
  const participante = readParticipantForm();
  const pronosticos = collectDraftPredictionValues();
  if (!hasDraftContent(participante, pronosticos)) {
    removeDraftStorage();
    return;
  }
  try {
    window.localStorage.setItem(PRODE_DRAFT_STORAGE_KEY, JSON.stringify({
      version: 1,
      updated_at: new Date().toISOString(),
      participante,
      pronosticos
    }));
  } catch (error) {
    // no-op
  }
}

function scheduleDraftSave() {
  if (!isDraftPage()) return;
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(saveDraftNow, PRODE_DRAFT_DEBOUNCE_MS);
}

function restoreDraftFormValues(participante = {}) {
  const fieldMap = {
    participanteNombre: participante.nombre,
    participanteApellido: participante.apellido,
    participanteHijo: participante.nombre_hijo,
    participanteApellidoHijo: participante.apellido_hijo,
    participanteNumeroSocio: participante.numero_socio,
    participanteCategoria: participante.categoria,
    participanteTira: participante.tira,
    participanteWhatsapp: participante.whatsapp
  };
  Object.entries(fieldMap).forEach(([id, value]) => {
    const node = byId(id);
    if (!node || value == null) return;
    node.value = String(value);
  });
}

function restoreDraftPredictionValues(pronosticos = {}) {
  Object.entries(pronosticos || {}).forEach(([partidoId, values]) => {
    setSelectedPredictionSign(partidoId, values?.sign || deriveSignFromGoals(values?.goles_local, values?.goles_visitante));
  });
}

function restoreDraftFromStorage() {
  const draft = readDraftStorage();
  if (!draft) return false;
  restoreDraftFormValues(draft.participante || {});
  restoreDraftPredictionValues(draft.pronosticos || {});
  setDraftNotice("Recuperamos una carga guardada en este dispositivo.", "restored");
  return true;
}

function clearDraftAndForm(options = {}) {
  if (!isDraftPage()) return;
  const { confirmFirst = true } = options;
  if (confirmFirst && !window.confirm("Queres borrar la carga guardada en este dispositivo?")) {
    return;
  }
  removeDraftStorage();
  window.clearTimeout(draftSaveTimer);
  const form = byId("prodeForm");
  form?.reset();
  state.submission.submitted = false;
  state.submission.sending = false;
  state.partidos.forEach(partido => {
    setSelectedPredictionSign(partido.id, "");
  });
  setSubmissionStatus("", "");
  setDraftNotice("", "");
  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  renderEndpointNotice();
}

function parseIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getProdeCierreDate(value = PRODE_CIERRE_ISO) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isProdeClosed(value = PRODE_CIERRE_ISO) {
  const cierre = getProdeCierreDate(value);
  if (!cierre) return false;
  return Date.now() > cierre.getTime();
}

function formatCierre(value = PRODE_CIERRE_ISO) {
  const cierre = getProdeCierreDate(value);
  if (!cierre) return "";
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(cierre);
}

function getCountdownParts(targetIso = MUNDIAL_INICIO_ISO) {
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { closed: true, days: "00", hours: "00", minutes: "00", seconds: "00" };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    closed: false,
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
}

function renderHeroCountdown() {
  const days = byId("countdownDays");
  const hours = byId("countdownHours");
  const minutes = byId("countdownMinutes");
  const seconds = byId("countdownSeconds");
  const heading = byId("countdownHeading");
  const caption = byId("countdownCaption");
  const grid = byId("countdownGrid");
  if (!days || !hours || !minutes || !seconds || !heading || !caption || !grid) return;

  const parts = getCountdownParts();
  if (!parts) {
    heading.textContent = "Mundial 2026";
    caption.textContent = "Cuenta regresiva al arranque del Mundial.";
    return;
  }

  days.textContent = parts.days;
  hours.textContent = parts.hours;
  minutes.textContent = parts.minutes;
  seconds.textContent = parts.seconds;

  if (parts.closed) {
    heading.textContent = "El Mundial ya empezó";
    caption.textContent = "Ya podés seguir el Prode con el torneo en marcha.";
    grid.classList.add("is-started");
  } else {
    heading.textContent = "Mundial 2026";
    caption.textContent = "La cuenta regresiva ya está en marcha.";
    grid.classList.remove("is-started");
  }
}

function startHeroCountdown() {
  renderHeroCountdown();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(renderHeroCountdown, 1000);
}

function formatDate(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return value || "-";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(parsed);
}

function formatDateLong(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return value || "-";
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "long" }).format(parsed);
}

function formatKickoffTime(value) {
  const raw = String(value || "").trim();
  return raw || "Horario a confirmar";
}

function formatMatchSchedule(partido) {
  return `${formatDateLong(partido.fecha)} | ${formatKickoffTime(partido.hora)}`;
}

function normalizeUrl(url, base = location.href) {
  try {
    const raw = String(url || "").trim();
    return raw ? new URL(raw, base) : null;
  } catch (error) {
    return null;
  }
}

function isSafeUrl(url) {
  const parsed = normalizeUrl(url);
  return !!parsed && parsed.protocol === "https:" && DOMINIOS_NOTICIAS.has(parsed.hostname.toLowerCase());
}

function safeText(value, max = 220) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanNewsItem(item) {
  if (!item || typeof item !== "object") return null;
  const parsed = normalizeUrl(item.url || item.link || "");
  if (!parsed || !isSafeUrl(parsed.href)) return null;
  const titulo = safeText(item.titulo, 130);
  if (!titulo) return null;
  return {
    fecha: safeText(item.fecha, 24),
    fuente: safeText(item.fuente || "FIFA", 40) || "FIFA",
    titulo,
    resumen: safeText(item.resumen || item.descripcion || "Noticia oficial del Mundial 2026.", 240),
    url: parsed.href
  };
}

function createNewsCard(item) {
  const anchor = document.createElement("a");
  anchor.className = "news-card";
  anchor.href = item.url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.innerHTML = `
    <span>${esc([item.fecha, item.fuente].filter(Boolean).join(" - "))}</span>
    <strong>${esc(item.titulo)}</strong>
    <p>${esc(item.resumen)}</p>
  `;
  return anchor;
}

function getMatchOutcome(match) {
  if (!match || match.estado !== "finalizado") return null;
  const gl = match.resultado_real?.goles_local;
  const gv = match.resultado_real?.goles_visitante;
  return deriveSignFromGoals(gl, gv) || null;
}

function calculatePoints(pronostico, partido) {
  if (!partido) return { puntos: 0, estado: "pendiente", exacto: 0, diferencia: 0, acierto: 0, playoff: 0 };
  const realOutcome = getMatchOutcome(partido);
  if (!realOutcome) return { puntos: 0, estado: "pendiente", exacto: 0, diferencia: 0, acierto: 0, playoff: 0 };

  const predictedSign = getPronosticoSign(pronostico);
  if (!predictedSign) return { puntos: 0, estado: "pendiente", exacto: 0, diferencia: 0, acierto: 0, playoff: 0 };

  const knockout = partido.instancia && partido.instancia !== "Grupos";

  if (predictedSign === realOutcome) {
    return { puntos: 1, estado: "signo", exacto: 0, diferencia: 0, acierto: 1, playoff: knockout ? 1 : 0 };
  }

  return { puntos: 0, estado: "error", exacto: 0, diferencia: 0, acierto: 0, playoff: 0 };
}

function calculateRanking(participantes = state.participantes) {
  const partidosMap = new Map(state.partidos.map(partido => [partido.id, partido]));
  const rows = participantes.map(participante => {
    const detalle = (participante.pronosticos || []).map(pronostico => {
      const partido = partidosMap.get(pronostico.partido_id);
      const calc = calculatePoints(pronostico, partido);
      return { pronostico, partido, ...calc };
    });

    const exactos = detalle.filter(item => item.estado === "exacto").length;
    const diferencias = detalle.filter(item => item.estado === "diferencia").length;
    const signos = detalle.filter(item => item.estado === "signo").length;
    const errores = detalle.filter(item => item.estado === "error").length;
    const pendientes = detalle.filter(item => item.estado === "pendiente").length;
    const aciertos = detalle.reduce((acc, item) => acc + item.acierto, 0);
    const puntos = detalle.reduce((acc, item) => acc + item.puntos, 0);
    const puntosPlayoff = detalle.reduce((acc, item) => acc + item.playoff, 0);

    return {
      ...participante,
      detalle,
      pronosticosCargados: (participante.pronosticos || []).length,
      puntos,
      exactos,
      diferencias,
      signos,
      errores,
      pendientes,
      aciertos,
      puntosPlayoff
    };
  }).sort((a, b) =>
    b.puntos - a.puntos ||
    b.aciertos - a.aciertos ||
    b.puntosPlayoff - a.puntosPlayoff ||
    a.apellido.localeCompare(b.apellido, "es") ||
    a.nombre.localeCompare(b.nombre, "es")
  );

  rows.forEach((row, index) => {
    row.puesto = index + 1;
  });

  return rows;
}

function bestBy(field, value) {
  return state.ranking.filter(item => item[field] === value).sort((a, b) => a.puesto - b.puesto)[0];
}

function getBadges(participante) {
  const badges = [];
  if (participante.puesto === 1) badges.push("Puntero general");
  if (participante.puesto <= 3) badges.push("Top 3");
  if (participante.aciertos >= 3) badges.push(`Aciertos x${participante.aciertos}`);
  if (bestBy("categoria", participante.categoria)?.id === participante.id) badges.push("Mejor de su categoria");
  return badges;
}

function getHeroPhrase(participante) {
  if (!participante) return "";
  if (participante.puesto === 1) return "Arranco arriba en la tabla familiar.";
  if (participante.puesto <= 3) return "Ya esta en zona de podio.";
  if (participante.aciertos) return "Viene leyendo bien los signos de los partidos.";
  return "Sigue prendido para cuando empiece el Mundial.";
}

function filterRanking() {
  const query = norm(state.busqueda);
  let rows = [...state.ranking];

  if (query) {
    rows = rows.filter(row => norm(`${row.nombre} ${row.apellido} ${row.nombre_hijo} ${row.apellido_hijo || ""}`).includes(query));
  }
  if (state.categoria) rows = rows.filter(row => row.categoria === state.categoria);
  if (state.tira) rows = rows.filter(row => row.tira === state.tira);
  if (state.grupo || state.fecha || state.instancia || state.seleccion) {
    rows = rows.filter(row => row.detalle.some(item => {
      const partido = item.partido;
      if (!partido) return false;
      if (state.grupo && partido.grupo !== state.grupo) return false;
      if (state.fecha && partido.fecha !== state.fecha) return false;
      if (state.instancia && partido.instancia !== state.instancia) return false;
      if (state.seleccion && partido.equipo_local !== state.seleccion && partido.equipo_visitante !== state.seleccion) return false;
      return true;
    }));
  }

  if (state.vista === "categorias" && state.categoria) rows = rows.filter(row => row.categoria === state.categoria);
  if (state.vista === "tiras" && state.tira) rows = rows.filter(row => row.tira === state.tira);
  if (state.vista === "puntos") rows.sort((a, b) => b.puntos - a.puntos || b.aciertos - a.aciertos || a.puesto - b.puesto);
  if (state.vista === "aciertos") rows.sort((a, b) => b.aciertos - a.aciertos || b.puntos - a.puntos || a.puesto - b.puesto);
  if (state.vista === "familias") rows.sort((a, b) => a.categoria.localeCompare(b.categoria, "es") || a.puesto - b.puesto);

  return rows;
}

function selectTemplate(id, label, values, selected, formatOptionLabel = value => value) {
  return `
    <label class="filter-label">
      <span>${label}</span>
      <select id="${id}">
        ${values.map(value => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${value ? esc(formatOptionLabel(value)) : "Todos"}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderSummary() {
  const container = byId("resumenProde");
  if (!container) return;
  const lider = state.ranking[0];
  const abiertos = state.partidos.filter(partido => partido.estado === "abierto").length;
  const finalizados = state.partidos.filter(partido => partido.estado === "finalizado").length;
  const pronosticos = state.participantes.reduce((acc, participante) => acc + (participante.pronosticos || []).length, 0);
  const promedios = state.ranking.length ? (state.ranking.reduce((acc, item) => acc + item.puntos, 0) / state.ranking.length).toFixed(1) : "0.0";
  const mejorCategoria = CATEGORIAS
    .map(cat => ({ cat, total: state.ranking.filter(item => item.categoria === cat).reduce((acc, item) => acc + item.puntos, 0) }))
    .sort((a, b) => b.total - a.total)[0];

  container.innerHTML = [
    ["Participantes", state.participantes.length],
    ["Partidos del Prode", state.partidos.length],
    ["Abiertos", abiertos],
    ["Finalizados", finalizados],
    ["Pronósticos cargados", pronosticos],
    ["Categoría caliente", mejorCategoria?.cat || "-"],
    ["Promedio general", promedios]
  ].map(([label, value]) => `<article class="summary-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
}

function normalizeTeamName(name) {
  return norm(name).replace(/[^a-z0-9]+/g, "");
}

function formatTeamDisplayName(name) {
  const raw = String(name || "").trim();
  const normalized = normalizeTeamName(name);
  if (DISPLAY_TEAM_NAMES[normalized]) {
    return DISPLAY_TEAM_NAMES[normalized];
  }
  const winnerGroup = raw.match(/^Winner Group ([A-Z])$/i);
  if (winnerGroup) return `Ganador Grupo ${winnerGroup[1].toUpperCase()}`;
  const runnerUpGroup = raw.match(/^Runner-up Group ([A-Z])$/i);
  if (runnerUpGroup) return `Segundo Grupo ${runnerUpGroup[1].toUpperCase()}`;
  const bestThird = raw.match(/^Best third (.+)$/i);
  if (bestThird) return `Mejor tercero ${bestThird[1].trim()}`;
  const winnerMatch = raw.match(/^Winner Match (\d+)$/i);
  if (winnerMatch) return `Ganador Partido ${winnerMatch[1]}`;
  const loserMatch = raw.match(/^Loser Match (\d+)$/i);
  if (loserMatch) return `Perdedor Partido ${loserMatch[1]}`;
  if (normalized.startsWith("europeanplayoff")) {
    const suffix = raw.split(/\s+/).pop();
    return `Playoff Europa ${suffix || ""}`.trim();
  }
  if (normalized.startsWith("fifaplayoff")) {
    const suffix = raw.split(/\s+/).pop();
    return `Playoff FIFA ${suffix || ""}`.trim();
  }
  if (normalized === "pendiente" || normalized === "tbd" || normalized.includes("definir")) {
    return "Pendiente";
  }
  return raw;
}

function getCountryCode(teamName) {
  return COUNTRY_CODES[normalizeTeamName(teamName)] || null;
}

function getTeamFlag(teamName) {
  const code = getCountryCode(teamName);
  if (!code) return { type: "fallback", value: "FIFA", code: null };
  if (/^[A-Z]{2}$/.test(String(code || "").toUpperCase())) {
    return { type: "image", value: code.toLowerCase(), code };
  }
  return { type: "fallback", value: code, code };
}

function getFallbackLabel(teamName) {
  const normalized = normalizeTeamName(teamName);
  if (!normalized) return "??";
  if (normalized.startsWith("playoffeuropa") || normalized.startsWith("europeanplayoff")) return "UEFA";
  if (normalized.startsWith("playoff") || normalized.includes("pendiente") || normalized === "tbd" || normalized.includes("definir")) return "FIFA";
  const parts = teamName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map(part => part[0] || "").join("").slice(0, 2).toUpperCase();
}

function renderTeamBadge(teamName) {
  const flag = getTeamFlag(teamName);
  const displayName = formatTeamDisplayName(teamName);
  if (flag.type === "image") {
    return `<span class="team-badge image-badge" aria-label="${esc(displayName)}"><img class="team-flag-img" src="https://flagcdn.com/w80/${esc(flag.value)}.png" srcset="https://flagcdn.com/w160/${esc(flag.value)}.png 2x" alt="Bandera de ${esc(displayName)}" loading="lazy" decoding="async" /></span>`;
  }
  const badgeText = flag.value || "FIFA";
  return `<span class="team-badge placeholder text-badge" aria-label="${esc(displayName)}"><span class="team-flag team-flag-fallback" aria-hidden="true">${esc(badgeText)}</span></span>`;
}

function renderTeamNote(teamName) {
  const normalized = normalizeTeamName(teamName);
  if (normalized.startsWith("playoffeuropa") || normalized.startsWith("europeanplayoff")) return "Playoff UEFA";
  if (normalized.startsWith("fifaplayoff")) return "Playoff FIFA";
  if (normalized.startsWith("playoff") || normalized.includes("pendiente") || normalized === "tbd" || normalized.includes("definir")) return "Clasificacion pendiente";
  if (
    normalized.startsWith("ganadorgrupo") ||
    normalized.startsWith("segundogrupo") ||
    normalized.startsWith("mejortercero") ||
    normalized.startsWith("ganadorpartido") ||
    normalized.startsWith("perdedorpartido")
  ) return "Cruce del cuadro";
  return "";
}

function updateHeroCTA() {
  const cta = byId("btnAnotateProde");
  const note = byId("heroCtaNote");
  if (!cta || !note) return;

  if (isProdeClosed()) {
    cta.textContent = "Prode cerrado";
    cta.classList.add("disabled");
    cta.setAttribute("aria-disabled", "true");
    cta.removeAttribute("href");
    note.textContent = "El Prode cerró. Ya no se reciben pronósticos.";
    return;
  }

  cta.innerHTML = 'Cargar mi Prode <span aria-hidden="true">&rarr;</span>';
  cta.classList.remove("disabled");
  cta.setAttribute("href", "prode-cargar.html");
  cta.removeAttribute("aria-disabled");
  note.textContent = "Completá tus datos y cargá tus primeros pronósticos.";
}

function openInfoModal(targetId = "modalInfoPremios") {
  const modal = byId("modalInfoProde");
  if (!modal) return;
  modal.classList.remove("oculto");
  const panel = modal.querySelector(".modal-panel");
  if (panel) panel.scrollTop = 0;
  if (targetId) {
    const target = byId(targetId);
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function closeInfoModal() {
  byId("modalInfoProde")?.classList.add("oculto");
}

function renderPredictionCardStatus(partido) {
  if (getSelectedPredictionSign(partido.id)) return "COMPLETO";
  return getPredictionStatusLabel(partido).toUpperCase();
}

function updatePredictionCardStates() {
  state.partidos.forEach(partido => {
    const statusNode = document.querySelector(`[data-card-status="${CSS.escape(partido.id)}"]`);
    const cardNode = document.querySelector(`[data-prediction-card="${CSS.escape(partido.id)}"]`);
    if (!statusNode || !cardNode) return;
    const status = renderPredictionCardStatus(partido);
    statusNode.textContent = status;
    cardNode.classList.toggle("complete", status === "COMPLETO");
  });
}

function renderMatchRow(teamName, goals) {
  const pending = !Number.isFinite(goals);
  const displayName = formatTeamDisplayName(teamName);
  const note = renderTeamNote(teamName);
  return `
    <div class="team-row">
      <div class="team-chip">
        ${renderTeamBadge(teamName)}
        <div class="team-copy">
          <span class="team-name">${esc(displayName)}</span>
          ${note ? `<span class="team-note">${esc(note)}</span>` : ""}
        </div>
      </div>
      <div class="match-score ${pending ? "pending" : ""}">${pending ? "-" : esc(goals)}</div>
    </div>
  `;
}

function renderMatchesOverview() {
  const container = byId("resumenPartidos");
  if (!container) return;
  const openMatches = state.partidos.filter(partido => partido.estado === "abierto");
  const nextMatch = [...openMatches].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))[0];
  const sedes = new Set(state.partidos.map(partido => partido.sede).filter(Boolean)).size;
  const instancias = new Set(state.partidos.map(partido => partido.instancia).filter(Boolean)).size;
  container.innerHTML = [
    ["Siguiente fecha", nextMatch ? formatDate(nextMatch.fecha) : "A confirmar"],
    ["Primer cruce", nextMatch ? `${formatTeamDisplayName(nextMatch.equipo_local)} vs ${formatTeamDisplayName(nextMatch.equipo_visitante)}` : "Sin partidos"],
    ["Sedes", sedes],
    ["Instancias", instancias]
  ].map(([label, value]) => `<article class="strip-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
}

function renderMatches() {
  const container = byId("listaPartidos");
  if (!container) return;
  const matches = [...state.partidos].sort((a, b) => {
    const byDate = (a.fecha || "").localeCompare(b.fecha || "");
    if (byDate) return byDate;
    return (a.id || "").localeCompare(b.id || "");
  });

  if (!matches.length) {
    container.innerHTML = '<div class="empty">Todavia no hay partidos cargados para el Prode.</div>';
    return;
  }

  container.innerHTML = matches.map(partido => {
    const realLocal = partido.resultado_real?.goles_local;
    const realVisit = partido.resultado_real?.goles_visitante;
    const finalizado = partido.estado === "finalizado" && Number.isFinite(realLocal) && Number.isFinite(realVisit);
    const stateClass = finalizado ? "finalizado" : (partido.estado || "proximo");
    return `
      <article class="match-card ${stateClass}">
        <div class="match-meta">
          <span>${esc([partido.instancia, partido.grupo].filter(Boolean).join(" - "))}</span>
          <span class="match-state ${stateClass}">${esc(finalizado ? "Resultado cargado" : "Disponible")}</span>
        </div>
        <div class="match-teams">
          ${renderMatchRow(partido.equipo_local, realLocal)}
          ${renderMatchRow(partido.equipo_visitante, realVisit)}
        </div>
        <div class="match-footer">
          <span>${esc(formatMatchSchedule(partido))}</span>
          <span>${esc(partido.sede || "Sede a confirmar")}</span>
        </div>
      </article>
    `;
  }).join("");
}

function isSheetsEndpointConfigured() {
  return /^https?:\/\//i.test(PRODE_SHEETS_ENDPOINT.trim());
}

function isEditablePredictionMatch(partido) {
  return partido?.estado === "abierto";
}

function getPredictionStatusLabel(partido) {
  if (partido?.estado === "finalizado") return "Cerrado con resultado";
  if (partido?.estado === "cerrado") return "Pronostico cerrado";
  if (partido?.estado === "abierto") return "Listo para cargar";
  return "A confirmar";
}

function renderParticipantSelectOptions() {
  const categoria = byId("participanteCategoria");
  const tira = byId("participanteTira");
  if (categoria && categoria.options.length <= 1) {
    categoria.innerHTML += CATEGORIAS.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("");
  }
  if (tira && tira.options.length <= 1) {
    tira.innerHTML += TIRAS.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("");
  }
}

function renderPredictionForm() {
  const container = byId("listaPronosticosFormulario");
  if (!container) return;

  const matches = [...state.partidos].sort((a, b) => {
    const byDate = (a.fecha || "").localeCompare(b.fecha || "");
    if (byDate) return byDate;
    return (a.id || "").localeCompare(b.id || "");
  });

  if (!matches.length) {
    container.innerHTML = '<div class="empty">Todavia no hay partidos disponibles para cargar.</div>';
    return;
  }

    container.innerHTML = matches.map(partido => {
      const editable = isEditablePredictionMatch(partido);
      const disabledAttr = editable ? "" : "disabled";
      const stageLabel = [partido.instancia, partido.grupo].filter(Boolean).join(" | ") || "MUNDIAL 2026";
      const localDisplay = formatTeamDisplayName(partido.equipo_local);
      const visitanteDisplay = formatTeamDisplayName(partido.equipo_visitante);
      return `
        <article class="prediction-entry-card ${editable ? "editable" : "locked"}" data-prediction-card="${esc(partido.id)}">
          <div class="prediction-entry-head">
            <span>${esc(stageLabel)}</span>
            <strong data-card-status="${esc(partido.id)}">${esc(getPredictionStatusLabel(partido).toUpperCase())}</strong>
          </div>
          <div class="prediction-entry-match">
            <div class="prediction-entry-team local">
              ${renderTeamBadge(partido.equipo_local)}
              <div class="prediction-entry-copy">
                <span class="team-name">${esc(localDisplay)}</span>
              </div>
            </div>
            <div class="prediction-entry-inputs prediction-sign-group" aria-label="Elegi quien gana o si empatan">
              ${[
                ["local", "Gana local"],
                ["empate", "Empate"],
                ["visitante", "Gana visitante"]
              ].map(([value, label]) => `
                <label class="prediction-sign-option ${value}">
                  <input
                    type="radio"
                    class="prediction-sign-input"
                    name="pred-sign-${esc(partido.id)}"
                    value="${esc(value)}"
                    data-partido-id="${esc(partido.id)}"
                    ${disabledAttr}
                  />
                  <span>${esc(label)}</span>
                </label>
              `).join("")}
            </div>
            <div class="prediction-entry-team visitor">
              ${renderTeamBadge(partido.equipo_visitante)}
              <div class="prediction-entry-copy">
                <span class="team-name">${esc(visitanteDisplay)}</span>
              </div>
            </div>
          </div>
          <div class="prediction-entry-meta">
            <span class="meta-pill"><span>Fecha</span><span>${esc(formatDateLong(partido.fecha))}</span></span>
            <span class="meta-pill"><span>Hora</span><span>${esc(formatKickoffTime(partido.hora))}</span></span>
            <span class="meta-pill"><span>Sede</span><span>${esc(partido.sede || "Sede a confirmar")}</span></span>
          </div>
        </article>
      `;
    }).join("");

  updatePredictionCardStates();
}

function collectPredictionRows() {
  const pronosticos = [];
  const incompletos = [];

  state.partidos.forEach(partido => {
    const sign = getSelectedPredictionSign(partido.id);
    if (!sign) return;
    const { goles_local, goles_visitante } = predictionSignToGoals(sign);

    pronosticos.push({
      partido_id: partido.id,
      equipo_local: partido.equipo_local,
      equipo_visitante: partido.equipo_visitante,
      sign,
      goles_local,
      goles_visitante
    });
  });

  return { pronosticos, incompletos };
}

function readParticipantForm() {
  return {
    nombre: byId("participanteNombre")?.value.trim() || "",
    apellido: byId("participanteApellido")?.value.trim() || "",
    nombre_hijo: byId("participanteHijo")?.value.trim() || "",
    apellido_hijo: byId("participanteApellidoHijo")?.value.trim() || "",
    numero_socio: byId("participanteNumeroSocio")?.value.trim() || "",
    categoria: byId("participanteCategoria")?.value || "",
    tira: byId("participanteTira")?.value || "",
    whatsapp: byId("participanteWhatsapp")?.value.trim() || ""
  };
}

function formatChildDisplay(participante) {
  const nombre = participante?.nombre_hijo || "";
  const apellido = participante?.apellido_hijo || "";
  const fullName = [nombre, apellido].filter(Boolean).join(" ").trim();
  return fullName || "sin chico/a";
}

function generateSubmissionId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `prode-${stamp}-${random}`;
}

function buildSubmissionPayload(participante, pronosticos) {
  return {
    participante,
    pronosticos,
    metadata: {
      origen: "baby-allboys",
      version: PRODE_SUBMISSION_VERSION,
      timestamp_cliente: new Date().toISOString(),
      submission_id: generateSubmissionId(),
      user_agent: navigator.userAgent
    }
  };
}

function setSubmissionStatus(type, message) {
  const node = byId("estadoEnvio");
  if (!node) return;
  node.className = `submit-status ${type || ""}`.trim();
  node.textContent = message || "";
}

function updateSubmissionSummary() {
  const node = byId("resumenCarga");
  if (!node) return;
  const participante = readParticipantForm();
  const { pronosticos, incompletos } = collectPredictionRows();
  const abiertos = state.partidos.filter(isEditablePredictionMatch).length;
  const familia = [participante.nombre, participante.apellido].filter(Boolean).join(" ");
  const hijo = formatChildDisplay(participante);

  node.innerHTML = `
    <article class="summary-card compact">
      <span>Familia</span>
      <strong>${esc(familia || "Pendiente")}</strong>
      <small>${esc(hijo)}</small>
    </article>
    <article class="summary-card compact">
      <span>Pron&oacute;sticos completos</span>
      <strong>${esc(pronosticos.length)}</strong>
      <small>${esc(`${incompletos.length} incompletos`)}</small>
    </article>
    <article class="summary-card compact">
      <span>Partidos editables</span>
      <strong>${esc(abiertos)}</strong>
      <small>${esc(`${state.partidos.length} cargados en el fixture`)}</small>
    </article>
  `;
}

function updateSubmissionButton() {
  const button = byId("btnConfirmarProde");
  if (!button) return;

  if (state.submission.sending) {
    button.disabled = true;
    button.textContent = "Enviando Prode...";
    return;
  }

  if (isProdeClosed()) {
    button.disabled = true;
    button.textContent = "Prode cerrado";
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    button.disabled = true;
    button.textContent = "Confirmar mi Prode";
    return;
  }

  if (state.submission.submitted) {
    button.disabled = true;
    button.textContent = "Prode enviado";
    return;
  }

  button.disabled = false;
  button.textContent = "Confirmar mi Prode";
}

function renderEndpointNotice() {
  const node = byId("prodeNotice");
  if (!node) return;
  const cierreTexto = formatCierre();

  if (isProdeClosed()) {
    node.className = "prode-alert warning";
    node.innerHTML = `<strong>El Prode cerr&oacute;.</strong> Ya no se reciben pron&oacute;sticos.${cierreTexto ? ` <span>Cerr&oacute; el ${esc(cierreTexto)}.</span>` : ""}`;
    return;
  }

  if (isSheetsEndpointConfigured()) {
    node.className = "prode-alert ok";
    node.innerHTML = cierreTexto
      ? `<strong>Ten&eacute;s tiempo hasta el ${esc(cierreTexto)} para participar.</strong>`
      : `<strong>Complet&aacute; tus datos y particip&aacute; del Prode.</strong>`;
    return;
  }

  node.className = "prode-alert warning";
  node.innerHTML = `<strong>El Prode todav&iacute;a no est&aacute; habilitado para recibir inscripciones.</strong>${cierreTexto ? ` <span>Ten&eacute;s tiempo hasta el ${esc(cierreTexto)} para participar.</span>` : ""}`;
}

async function sendSubmissionToSheets(payload) {
  const response = await fetch(PRODE_SHEETS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (error) {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(parsed?.error || raw || `HTTP ${response.status}`);
  }
  if (parsed && parsed.ok === false) {
    throw new Error(parsed.error || "El Apps Script rechazo el envio.");
  }
  return parsed || raw;
}

async function handleSubmission(event) {
  event.preventDefault();
  if (state.submission.sending) return;

  const participante = readParticipantForm();
  if (!participante.apellido_hijo) {
    byId("participanteApellidoHijo")?.focus();
    setSubmissionStatus("error", "Completá el apellido del chico/a.");
    return;
  }

  const form = byId("prodeForm");
  if (!form?.reportValidity()) {
    setSubmissionStatus("error", "Revisá los datos obligatorios antes de confirmar.");
    return;
  }

  if (isProdeClosed()) {
    setSubmissionStatus("warning", "El Prode cerró. Ya no se reciben pronósticos.");
    updateSubmissionButton();
    renderEndpointNotice();
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    setSubmissionStatus("warning", "El Prode todavía no está habilitado para recibir inscripciones.");
    updateSubmissionButton();
    return;
  }

  const { pronosticos, incompletos } = collectPredictionRows();
  if (incompletos.length) {
    setSubmissionStatus("error", "Revisa los pronosticos antes de confirmar tu Prode.");
    return;
  }
  if (!pronosticos.length) {
    setSubmissionStatus("error", "Elegi al menos un signo antes de confirmar tu Prode.");
    return;
  }

  const payload = buildSubmissionPayload(participante, pronosticos);

  state.submission.sending = true;
  updateSubmissionButton();
  setSubmissionStatus("info", "Estamos enviando tu Prode...");

  try {
    await sendSubmissionToSheets(payload);
    state.submission.submitted = true;
    removeDraftStorage();
    window.clearTimeout(draftSaveTimer);
    setDraftNotice("", "");
    setSubmissionStatus("success", "Listo, tu Prode fue enviado.");
  } catch (error) {
    const message = String(error?.message || "").trim();
    const publicErrors = [
      "Ya existe un Prode cargado para este jugador/a. Si necesitás corregirlo, hablá con la organización.",
      "El Prode cerró. Ya no se reciben pronósticos."
    ];
    const legacyDuplicateError = "Ya existe un Prode cargado para este participante. Si necesitás corregirlo, hablá con la organización.";
    const publicMessage = message === legacyDuplicateError
      ? publicErrors[0]
      : (publicErrors.includes(message) ? message : "No pudimos enviar tu Prode. Probá de nuevo.");
    setSubmissionStatus("error", publicMessage);
  } finally {
    state.submission.sending = false;
    updateSubmissionButton();
  }
}

function handleSubmissionInputChange() {
  if (state.submission.submitted) {
    state.submission.submitted = false;
    setSubmissionStatus("info", "Hiciste cambios en el formulario. Revisalos y confirmá de nuevo.");
  }
  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  scheduleDraftSave();
}

function renderFilters() {
  const tabs = byId("tabsRanking");
  const filters = byId("filtrosProde");
  if (!tabs || !filters) return;
  const grupos = [...new Set(state.partidos.map(partido => partido.grupo).filter(Boolean))];
  const fechas = [...new Set(state.partidos.map(partido => partido.fecha).filter(Boolean))];
  const selecciones = [...new Set(state.partidos.flatMap(partido => [partido.equipo_local, partido.equipo_visitante]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

  tabs.innerHTML = [
    ["general", "General"],
    ["categorias", "Categorias"],
    ["tiras", "Tiras"],
    ["puntos", "Puntos"],
    ["aciertos", "Aciertos"],
    ["familias", "Familias"]
  ].map(([id, label]) => `<button class="tab-btn ${state.vista === id ? "activo" : ""}" data-tab="${id}">${label}</button>`).join("");

  filters.innerHTML = `
    ${selectTemplate("categoria", "Categoria", ["", ...CATEGORIAS], state.categoria)}
    ${selectTemplate("tira", "Tira", ["", ...TIRAS], state.tira)}
    ${selectTemplate("grupo", "Grupo", ["", ...grupos], state.grupo)}
    ${selectTemplate("instancia", "Instancia", ["", ...INSTANCIAS], state.instancia)}
    ${selectTemplate("fecha", "Fecha", ["", ...fechas], state.fecha)}
    ${selectTemplate("seleccion", "Seleccion", ["", ...selecciones], state.seleccion, formatTeamDisplayName)}
    <button type="button" class="clear-btn" id="limpiarFiltros">Limpiar</button>
  `;
}

function renderRanking() {
  const titleNode = byId("tituloRanking");
  const listNode = byId("rankingLista");
  if (!titleNode || !listNode) return;
  const rows = filterRanking();
  const titles = {
    general: "Tabla general",
    categorias: "Ranking por categoria",
    tiras: "Ranking por tira",
    puntos: "Mas puntos",
    aciertos: "Mas aciertos de signo",
    familias: "Busqueda por familia"
  };
  titleNode.textContent = titles[state.vista] || "Tabla general";

  if (!state.participantes.length) {
    listNode.innerHTML = '<div class="empty">Todavia no hay participantes cargados.</div>';
    return;
  }
  if (!rows.length) {
    listNode.innerHTML = '<div class="empty">No hay familias para esos filtros.</div>';
    return;
  }

  const finalizados = state.partidos.some(partido => partido.estado === "finalizado");
  listNode.innerHTML = `${!finalizados ? '<div class="empty">El ranking va a cobrar vida cuando haya resultados oficiales cargados.</div>' : ""}${rows.map(row => `
    <button type="button" class="rank-card ${row.puesto === 1 ? "top1" : ""}" data-id="${esc(row.id)}">
      <span class="place">${row.puesto <= 3 ? `#${row.puesto}` : row.puesto}</span>
      <span class="who">
        <strong>${esc(row.apellido)}, ${esc(row.nombre)}</strong>
        <span>Hijo: ${esc(formatChildDisplay(row))} - ${esc(row.categoria)} - ${esc(row.tira)}</span>
        <span class="stats-mini">Aciertos ${row.aciertos} - Errores ${row.errores} - Pendientes ${row.pendientes}</span>
      </span>
      <span class="points"><strong>${row.puntos}</strong><span>pts</span></span>
      <span class="badges">${getBadges(row).map(badge => `<span class="badge">${esc(badge)}</span>`).join("")}</span>
    </button>
  `).join("")}`;
}

function renderShareCard() {
  const container = byId("cardViral");
  if (!container) return;
  const participante = filterRanking()[0] || state.ranking[0];
  container.innerHTML = participante ? `
    <div class="viral-rank">
      <div>
        <span>Puesto</span>
        <strong>#${participante.puesto}</strong>
      </div>
      <div class="points">
        <strong>${participante.puntos}</strong>
        <span>pts</span>
      </div>
    </div>
    <div class="viral-name">${esc(participante.nombre)} ${esc(participante.apellido)}</div>
    <div class="viral-meta">${esc(participante.categoria)} - ${esc(participante.tira)} - Hijo: ${esc(formatChildDisplay(participante))}</div>
    <div class="viral-phrase">${esc(getHeroPhrase(participante))}</div>
  ` : '<div class="empty">La card del puntero se activa cuando haya participantes cargados.</div>';
}

function detailTemplate(label, value) {
  return `<div class="detail-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function renderPrediction(item) {
  const partido = item.partido;
  const pronostico = item.pronostico || {};
  if (!partido) {
    return '<article class="prediction"><div class="prediction-top">Partido inexistente <span class="state-pendiente">Pendiente</span></div></article>';
  }

  const predictedSign = getPronosticoSign(pronostico);
  const real = getMatchOutcome(partido) ? (PREDICTION_SIGN_LABELS[getMatchOutcome(partido)] || "Pendiente") : "Pendiente";
  const statusLabels = {
    signo: "Acierto",
    error: "Error",
    pendiente: "Pendiente"
  };

  return `
    <article class="prediction">
      <div class="prediction-top">
        <span>${esc(partido.equipo_local)} vs ${esc(partido.equipo_visitante)}</span>
        <span class="state-${item.estado}">${esc(statusLabels[item.estado] || "Pendiente")}</span>
      </div>
      <div class="prediction-meta">${esc(formatDate(partido.fecha))} - ${esc(partido.grupo || partido.instancia)} - Pronostico ${esc(PREDICTION_SIGN_LABELS[predictedSign] || "-")} - Real ${esc(real)} - ${esc(item.puntos)} pts</div>
    </article>
  `;
}

function renderParticipantDetail(id) {
  const participante = state.ranking.find(item => item.id === id);
  if (!participante) return;

  const categoryRank = state.ranking.filter(item => item.categoria === participante.categoria).findIndex(item => item.id === participante.id) + 1;
  const teamRank = state.ranking.filter(item => item.tira === participante.tira).findIndex(item => item.id === participante.id) + 1;

  byId("detalleParticipante").innerHTML = `
    <div class="detail-head">
      <p class="eyebrow">Ficha de familia</p>
      <h3 id="modalTitulo">${esc(participante.nombre)} ${esc(participante.apellido)}</h3>
      <p>Hijo: ${esc(formatChildDisplay(participante))} - ${esc(participante.categoria)} - ${esc(participante.tira)}</p>
    </div>
    <div class="detail-grid">
      ${detailTemplate("Puesto general", `#${participante.puesto}`)}
      ${detailTemplate("Puesto categoria", `#${categoryRank}`)}
      ${detailTemplate("Puesto tira", `#${teamRank}`)}
      ${detailTemplate("Puntos", participante.puntos)}
      ${detailTemplate("Aciertos", participante.aciertos)}
      ${detailTemplate("Puntos playoff", participante.puntosPlayoff)}
      ${detailTemplate("Pronosticos", participante.pronosticosCargados)}
    </div>
    <button type="button" class="primary-action" data-share="${esc(participante.id)}">Compartir mi puesto</button>
    <div class="prediction-list">${participante.detalle.map(renderPrediction).join("")}</div>
  `;

  byId("modalParticipante").classList.remove("oculto");
}

async function shareStanding(id) {
  const participante = state.ranking.find(item => item.id === id) || state.ranking[0];
  if (!participante) return;

  const text = `Estoy #${participante.puesto} en el Prode 26 All Boys. ${participante.nombre} ${participante.apellido} suma ${participante.puntos} puntos.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Prode 26 All Boys", text, url: location.href });
      return;
    } catch (error) {
      // fallback to clipboard below
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    alert("Mensaje copiado");
    return;
  }

  alert(text);
}

function renderAdminPanel() {
  const container = byId("panelAdminProde");
  if (!container) return;

  const items = [
    {
      tag: "Planilla",
      title: "Cargar familias",
      text: "Modelo CSV para preparar participantes y volcar luego al JSON del Prode.",
      href: "data/prode/planilla_prode_modelo.csv",
      code: "data/prode/planilla_prode_modelo.csv"
    },
    {
      tag: "Guia",
      title: "README de carga",
      text: "Explica como completar participantes, pronosticos y resultados reales sin tocar la estructura.",
      href: "data/prode/README-CARGA.md",
      code: "data/prode/README-CARGA.md"
    },
    {
      tag: "Admin",
      title: "Panel interno del Prode",
      text: "El ranking y la carga administrativa se mantienen como base para la siguiente etapa.",
      href: "admin-prode.html",
      code: "admin-prode.html"
    }
  ];

  container.innerHTML = items.map(item => `
    <a class="admin-card" href="${esc(item.href)}" target="_blank" rel="noopener">
      <span>${esc(item.tag)}</span>
      <strong>${esc(item.title)}</strong>
      <p>${esc(item.text)}</p>
      <code>${esc(item.code)}</code>
    </a>
  `).join("");
}

async function renderNews() {
  const container = byId("noticiasMundial");
  if (!container) return;
  try {
    const data = await fetch("data/prode/noticias-mundial.json", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error("news");
      return response.json();
    });
    const items = Array.isArray(data) ? data.map(cleanNewsItem).filter(Boolean).slice(0, 3) : [];
    if (!items.length) {
      container.innerHTML = '<div class="empty">Todavia no hay noticias confiables cargadas.</div>';
      return;
    }
    container.replaceChildren(...items.map(createNewsCard));
  } catch (error) {
    container.innerHTML = '<div class="empty">No se pudieron cargar las noticias del Mundial.</div>';
  }
}

function renderAll() {
  renderSummary();
  renderHeroCountdown();
  updateHeroCTA();
  renderParticipantSelectOptions();
  renderEndpointNotice();
  renderPredictionForm();
  renderMatchesOverview();
  renderMatches();
  updateSubmissionSummary();
  updateSubmissionButton();
  renderFilters();
  renderRanking();
  renderShareCard();
  renderAdminPanel();
}

function bindStaticEvents() {
  byId("buscador")?.addEventListener("input", event => {
    state.busqueda = event.target.value;
    renderRanking();
    renderShareCard();
  });

  byId("tabsRanking")?.addEventListener("click", event => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    state.vista = button.dataset.tab;
    renderFilters();
    bindDynamicFilters();
    renderRanking();
    renderShareCard();
  });

  byId("rankingLista")?.addEventListener("click", event => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    renderParticipantDetail(card.dataset.id);
  });

  byId("modalParticipante")?.addEventListener("click", event => {
    if (event.target.closest("[data-close-modal]")) {
      byId("modalParticipante").classList.add("oculto");
    }
    const shareButton = event.target.closest("[data-share]");
    if (shareButton) {
      shareStanding(shareButton.dataset.share);
    }
  });

  byId("modalInfoProde")?.addEventListener("click", event => {
    if (event.target.closest("[data-close-info]")) {
      closeInfoModal();
      return;
    }
    const scrollButton = event.target.closest("[data-info-scroll]");
    if (scrollButton) {
      const target = byId(scrollButton.dataset.infoScroll || "");
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-open-info]");
    if (!trigger) return;
    event.preventDefault();
    const targetMap = {
      premios: "modalInfoPremios",
      "como-juega": "modalInfoComoJuega",
      reglas: "modalInfoReglas"
    };
    openInfoModal(targetMap[trigger.dataset.openInfo] || "modalInfoPremios");
  });

  byId("btnCompartirLider")?.addEventListener("click", () => shareStanding(state.ranking[0]?.id));
  byId("btnLimpiarCarga")?.addEventListener("click", () => clearDraftAndForm({ confirmFirst: true }));
  byId("prodeForm")?.addEventListener("submit", handleSubmission);
  byId("prodeForm")?.addEventListener("input", handleSubmissionInputChange);
  byId("prodeForm")?.addEventListener("change", handleSubmissionInputChange);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      byId("modalParticipante")?.classList.add("oculto");
      closeInfoModal();
    }
  });
}

function bindDynamicFilters() {
  if (!byId("filtrosProde")) return;
  ["categoria", "tira", "grupo", "fecha", "instancia", "seleccion"].forEach(id => {
    byId(id)?.addEventListener("change", event => {
      state[id] = event.target.value;
      renderRanking();
      renderShareCard();
    });
  });

  byId("limpiarFiltros")?.addEventListener("click", () => {
    Object.assign(state, {
      busqueda: "",
      categoria: "",
      tira: "",
      grupo: "",
      fecha: "",
      instancia: "",
      seleccion: ""
    });
    if (byId("buscador")) byId("buscador").value = "";
    renderFilters();
    bindDynamicFilters();
    renderRanking();
    renderShareCard();
  });
}

async function init() {
  try {
    const [participantes, partidos] = await Promise.all([
      fetch("data/prode/participantes.json", { cache: "no-store" }).then(response => {
        if (!response.ok) throw new Error("participantes");
        return response.json();
      }),
      fetch("data/prode/partidos.json", { cache: "no-store" }).then(response => {
        if (!response.ok) throw new Error("partidos");
        return response.json();
      })
    ]);

    state.participantes = Array.isArray(participantes) ? participantes : [];
    state.partidos = Array.isArray(partidos) ? partidos : [];
    state.ranking = calculateRanking();

    byId("estadoCarga").className = "status-card ok";
    startHeroCountdown();
    renderAll();
    restoreDraftFromStorage();
    updateSubmissionSummary();
    updatePredictionCardStates();
    updateSubmissionButton();
    bindStaticEvents();
    bindDynamicFilters();
    renderNews();
  } catch (error) {
    byId("estadoCarga").className = "status-card error";
    byId("estadoCarga").textContent = "No se pudieron cargar los datos del Prode.";
    console.error(error);
  }
}

init();
