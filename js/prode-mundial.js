const CATEGORIAS = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"];
const TIRAS = ["All Boys A", "All Boys B", "Los Albos", "All Boys"];
const INSTANCIAS = ["Grupos", "32avos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];
const DOMINIOS_NOTICIAS = new Set(["fifa.com", "www.fifa.com", "inside.fifa.com"]);
const PRODE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbz1Vu2DhG0X8ZvgnSlL86i-j_ODhXTuod4cujysuaNyNHCb7pC4K1TGoETDQJECXMnS/exec";
const PRODE_CIERRE_ISO = "";
const MUNDIAL_INICIO_ISO = "2026-06-11T13:00:00-03:00";
const MATCH_CUTOFF_MINUTES = 15;
const PRODE_SUBMISSION_VERSION = "solo-sign";
const PRODE_DRAFT_STORAGE_KEY = "prode26_allboys_draft_v1";
const PRODE_PARTICIPANT_CODE_STORAGE_KEY = "prode26_allboys_participant_code";
const TERMS_VERSION = "2026-06-11-v3";
const TERMS_VERSION_STORAGE_KEY = "prode26_allboys_terms_version";
const TERMS_ACCEPTED_AT_STORAGE_KEY = "prode26_allboys_terms_accepted_at";
const PRODE_ACCESS_CODE = "ALBO2026";
const PARTICIPANT_TYPES = {
  JUGADOR: "JUGADOR",
  FAMILIAR: "FAMILIAR",
  PROFESOR: "PROFESOR",
  DELEGADO: "DELEGADO"
};
const PRODE_DRAFT_DEBOUNCE_MS = 250;
const EXPECTED_PRODE_ERROR_CODES = new Set(["DUPLICATE_WITHOUT_CODE", "CODE_NOT_FOUND", "CODE_REQUIRED", "STAGE_CLOSED", "STAGE_NOT_OPEN", "GLOBAL_CLOSED", "INVALID_ACCESS_CODE", "PREDICTION_ALREADY_LOCKED", "MATCH_CLOSED", "MATCH_TIME_MISSING", "INVALID_KNOCKOUT_RESULT", "KNOCKOUT_MATCH_NOT_READY", "BRACKET_DEPENDENCY_LOCKED"]);
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
  publicRanking: {
    loading: false,
    loaded: false,
    error: "",
    generatedAt: "",
    totalParticipantes: 0,
    totalResultadosFinales: 0,
    top5: [],
    rankingGeneral: [],
      rankingPorCategoria: {}
  },
  openStage: {
    stage_id: "",
    stage_label: "",
    status: "",
    editable_now: false,
    editable_until: "",
    loaded: false,
    error: ""
  },
  matchesSource: {
    remoteLoaded: false,
    remoteError: ""
  },
  vista: "general",
  busqueda: "",
  categoria: "",
  tira: "",
  grupo: "",
  fecha: "",
  instancia: "",
  seleccion: "",
  submission: {
    entryMode: "create",
    mode: "create",
    participantCode: "",
    stageId: "",
    locked: false,
    savedPredictions: {},
    sending: false,
    submitted: false,
    lastAction: "",
    successCode: ""
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

function normalizeStageId(value) {
  const raw = norm(value).replace(/[_\-\s]+/g, "");
  if (!raw) return "";
  if (raw === "grupos") return "grupos";
  if (raw === "32avos") return "32avos";
  if (raw === "octavos") return "octavos";
  if (raw === "cuartos") return "cuartos";
  if (raw === "semifinal" || raw === "semifinales") return "semifinales";
  if (raw === "tercerpuesto" || raw === "final" || raw === "finales") return "finales";
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getMatchStageId(partido) {
  const matchId = String(partido?.id || partido?.partido_id || "").trim().toUpperCase();
  if (/^M\d{3}$/.test(matchId)) {
    const number = Number(matchId.slice(1));
    if (number >= 1 && number <= 72) return "grupos";
    if (number >= 73 && number <= 88) return "32avos";
    if (number >= 89 && number <= 96) return "octavos";
    if (number >= 97 && number <= 100) return "cuartos";
    if (number >= 101 && number <= 102) return "semifinales";
    if (number >= 103 && number <= 104) return "finales";
  }
  return normalizeStageId(partido?.stage_id || partido?.instancia || "");
}

function getCurrentOpenStageId() {
  return normalizeStageId(state.openStage?.stage_id || "");
}

function isKnockoutPredictionMatch(partido) {
  return getMatchStageId(partido) && getMatchStageId(partido) !== "grupos";
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

function predictionSignToSubmissionValue(sign) {
  const normalized = normalizePredictionSign(sign);
  if (normalized === "local") return "LOCAL";
  if (normalized === "empate") return "EMPATE";
  if (normalized === "visitante") return "VISITANTE";
  return "";
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

function isLocalPreviewHost() {
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || "");
}

function shouldUseLivePublicRanking() {
  const forceLive = new URLSearchParams(window.location.search).get("liveRanking") === "1";
  return isSheetsEndpointConfigured() && (forceLive || !isLocalPreviewHost());
}

function readParticipantCodeStorage() {
  try {
    return normalizeParticipantCode(window.localStorage.getItem(PRODE_PARTICIPANT_CODE_STORAGE_KEY) || "");
  } catch (error) {
    return "";
  }
}

function writeParticipantCodeStorage(code) {
  const normalized = normalizeParticipantCode(code);
  if (!normalized) return;
  try {
    window.localStorage.setItem(PRODE_PARTICIPANT_CODE_STORAGE_KEY, normalized);
  } catch (error) {
    // no-op
  }
}

function removeParticipantCodeStorage() {
  try {
    window.localStorage.removeItem(PRODE_PARTICIPANT_CODE_STORAGE_KEY);
  } catch (error) {
    // no-op
  }
}

function normalizeParticipantCode(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!raw) return "";
  if (raw.startsWith("BABY") && raw.length > 4) {
    return `BABY-${raw.slice(4)}`;
  }
  return raw;
}

function readTermsVersionStorage() {
  try {
    return String(window.localStorage.getItem(TERMS_VERSION_STORAGE_KEY) || "").trim();
  } catch (error) {
    return "";
  }
}

function readTermsAcceptedAtStorage() {
  try {
    return String(window.localStorage.getItem(TERMS_ACCEPTED_AT_STORAGE_KEY) || "").trim();
  } catch (error) {
    return "";
  }
}

function removeTermsAcceptanceStorage() {
  try {
    window.localStorage.removeItem(TERMS_VERSION_STORAGE_KEY);
    window.localStorage.removeItem(TERMS_ACCEPTED_AT_STORAGE_KEY);
  } catch (error) {
    // no-op
  }
}

function writeTermsAcceptanceStorage(acceptedAt) {
  const timestamp = String(acceptedAt || "").trim() || new Date().toISOString();
  try {
    window.localStorage.setItem(TERMS_VERSION_STORAGE_KEY, TERMS_VERSION);
    window.localStorage.setItem(TERMS_ACCEPTED_AT_STORAGE_KEY, timestamp);
  } catch (error) {
    // no-op
  }
  return timestamp;
}

function getTermsCheckbox() {
  return byId("termsAccepted");
}

function hasStoredTermsAcceptance() {
  const storedVersion = readTermsVersionStorage();
  const storedAcceptedAt = readTermsAcceptedAtStorage();
  if (!storedVersion && !storedAcceptedAt) return false;
  if (storedVersion !== TERMS_VERSION || !storedAcceptedAt) {
    removeTermsAcceptanceStorage();
    return false;
  }
  return true;
}

function isTermsAccepted() {
  return Boolean(getTermsCheckbox()?.checked);
}

function syncTermsAcceptanceStorage() {
  const checkbox = getTermsCheckbox();
  if (!checkbox || !checkbox.checked) {
    removeTermsAcceptanceStorage();
    return "";
  }
  return writeTermsAcceptanceStorage(readTermsAcceptedAtStorage());
}

function restoreTermsAcceptanceState() {
  const checkbox = getTermsCheckbox();
  const versionLabel = byId("termsVersionLabel");
  if (versionLabel) {
    versionLabel.textContent = `Versi\u00f3n ${TERMS_VERSION}`;
  }
  if (!checkbox) return;
  checkbox.checked = hasStoredTermsAcceptance();
}

function isEditMode() {
  return state.submission.mode === "edit" && Boolean(state.submission.participantCode);
}

function isStageLocked() {
  return Boolean(state.submission.locked);
}

function clearAllPredictionSelections() {
  state.partidos.forEach(partido => {
    setSelectedPredictionSign(partido.id, "");
  });
}

function getParticipantFieldIds() {
  return [
    "participanteTipo",
    "participanteAccessCode",
    "participanteNombre",
    "participanteApellido",
    "participanteVinculo",
    "participanteHijo",
    "participanteApellidoHijo",
    "participanteNumeroSocio",
    "participanteCategoria",
    "participanteTira",
    "participanteWhatsapp"
  ];
}

function setParticipantFieldsDisabled(disabled) {
  getParticipantFieldIds().forEach(id => {
    const node = byId(id);
    if (!node) return;
    if (id === "participanteAccessCode") {
      node.disabled = false;
      return;
    }
    node.disabled = disabled;
  });
}

function getParticipantType() {
  const raw = String(byId("participanteTipo")?.value || "").trim().toUpperCase();
  return PARTICIPANT_TYPES[raw] || raw || PARTICIPANT_TYPES.JUGADOR;
}

function getParticipantAccessCode() {
  return String(byId("participanteAccessCode")?.value || "").trim().toUpperCase();
}

function isValidAccessCode(value = getParticipantAccessCode()) {
  return String(value || "").trim().toUpperCase() === PRODE_ACCESS_CODE;
}

function setParticipantTypeNotice(message = "", type = "info") {
  const node = byId("participantTypeNotice");
  if (!node) return;
  if (!message) {
    node.textContent = "";
    node.className = "participant-type-notice oculto";
    return;
  }
  node.textContent = message;
  node.className = `participant-type-notice ${type}`.trim();
}

function setFieldRequired(id, required) {
  const node = byId(id);
  if (!node) return;
  node.required = Boolean(required);
  node.setAttribute("aria-required", required ? "true" : "false");
}

function setFieldVisibility(id, visible) {
  byId(id)?.classList.toggle("oculto", !visible);
}

function setFieldLabelText(id, text) {
  const node = byId(id);
  if (node) node.textContent = text;
}

function updateParticipantTypeUI() {
  const type = getParticipantType();
  const isPlayer = type === PARTICIPANT_TYPES.JUGADOR;
  const isFamily = type === PARTICIPANT_TYPES.FAMILIAR;
  const isProfessor = type === PARTICIPANT_TYPES.PROFESOR;
  const isDelegate = type === PARTICIPANT_TYPES.DELEGADO;

  setFieldVisibility("fieldParticipanteVinculo", isFamily);
  setFieldVisibility("fieldParticipanteHijo", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteApellidoHijo", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteNumeroSocio", true);
  setFieldVisibility("fieldParticipanteCategoria", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteTira", true);

  setFieldRequired("participanteVinculo", isFamily);
  setFieldRequired("participanteHijo", isPlayer || isFamily);
  setFieldRequired("participanteApellidoHijo", isPlayer || isFamily);
  setFieldRequired("participanteNumeroSocio", true);
  setFieldRequired("participanteCategoria", isPlayer || isFamily);
  setFieldRequired("participanteTira", isPlayer || isFamily);
  setFieldRequired("participanteWhatsapp", isFamily || isProfessor || isDelegate);

  if (isPlayer) {
    setFieldLabelText("labelParticipanteNombre", "Nombre adulto");
    setFieldLabelText("labelParticipanteApellido", "Apellido adulto");
    setFieldLabelText("labelParticipanteHijo", "Nombre chico/a");
    setFieldLabelText("labelParticipanteApellidoHijo", "Apellido del chico/a");
    setFieldLabelText("labelParticipanteNumeroSocio", "Número de socio del chico/a");
    setFieldLabelText("labelParticipanteCategoria", "Categoría");
    setFieldLabelText("labelParticipanteTira", "Tira / equipo");
    setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp opcional");
    const help = byId("helpParticipanteNumeroSocio");
    if (help) help.textContent = "Si lo sabés, nos ayuda a evitar duplicados.";
    setParticipantTypeNotice("", "");
    return;
  }

  if (isFamily) {
    setFieldLabelText("labelParticipanteNombre", "Nombre del adulto participante");
    setFieldLabelText("labelParticipanteApellido", "Apellido del adulto participante");
    setFieldLabelText("labelParticipanteHijo", "Nombre del jugador/a vinculado");
    setFieldLabelText("labelParticipanteApellidoHijo", "Apellido del jugador/a vinculado");
    setFieldLabelText("labelParticipanteCategoria", "Categoría del jugador/a vinculado");
    setFieldLabelText("labelParticipanteTira", "Tira / equipo del jugador/a vinculado");
    setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp");
    setParticipantTypeNotice("Esta opción es solo para familiares o adultos responsables vinculados a un jugador/a de Baby All Boys.", "info");
    return;
  }

  const roleLabel = isProfessor ? "profesor" : "delegado";
  setFieldLabelText("labelParticipanteNombre", `Nombre del ${roleLabel}`);
  setFieldLabelText("labelParticipanteApellido", `Apellido del ${roleLabel}`);
  setFieldLabelText("labelParticipanteTira", "Tira / equipo vinculado");
  setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp");
  setParticipantTypeNotice(
    isProfessor
      ? "Esta opción es solo para profesores vinculados al Baby All Boys."
      : "Esta opción es solo para delegados vinculados al Baby All Boys.",
    "info"
  );
}

function setCodeLookupStatus(message = "", type = "") {
  const node = byId("codeLookupStatus");
  if (!node) return;
  node.className = `submit-status ${type || ""}`.trim();
  node.textContent = message || "";
}

function renderParticipantCodeUI() {
  const modeButtons = Array.from(document.querySelectorAll("[data-entry-mode]"));
  const savedCodePrompt = byId("savedCodePrompt");
  const savedCodeValue = byId("savedCodeValue");
  const codeLookupPanel = byId("codeLookupPanel");
  const currentCodeBanner = byId("currentCodeBanner");
  const currentParticipantCode = byId("currentParticipantCode");
  const currentParticipantMode = byId("currentParticipantMode");
  const successBox = byId("participantCodeSuccess");
  const successValue = byId("participantCodeSuccessValue");
  const storedCode = readParticipantCodeStorage();
  const hasSessionCode = Boolean(state.submission.participantCode);

  modeButtons.forEach(button => {
    const active = button.dataset.entryMode === state.submission.entryMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (savedCodePrompt && savedCodeValue) {
    const showSavedCodePrompt = Boolean(storedCode) && !hasSessionCode;
    savedCodePrompt.classList.toggle("oculto", !showSavedCodePrompt);
    savedCodeValue.textContent = storedCode || "-";
  }

  if (codeLookupPanel) {
    const shouldShowLookup = state.submission.entryMode === "code" && !hasSessionCode;
    codeLookupPanel.classList.toggle("oculto", !shouldShowLookup);
  }

  if (currentCodeBanner && currentParticipantCode && currentParticipantMode) {
    currentCodeBanner.classList.toggle("oculto", !hasSessionCode);
    currentParticipantCode.textContent = state.submission.participantCode || "-";
    currentParticipantMode.textContent = isStageLocked()
      ? "Esta etapa est\u00e1 cerrada y qued\u00f3 en solo lectura."
      : "Pod\u00e9s actualizar esta etapa abierta con tu c\u00f3digo.";
  }

  if (successBox && successValue) {
    successBox.classList.toggle("oculto", !state.submission.successCode);
    successValue.textContent = state.submission.successCode || "-";
  }

  setParticipantFieldsDisabled(isEditMode());
}

function setSubmissionMode(nextMode, options = {}) {
  const { participantCode = "", stageId = "", locked = false, entryMode = null, successCode = "" } = options;
  state.submission.mode = nextMode;
  state.submission.participantCode = participantCode;
  state.submission.stageId = stageId;
  state.submission.locked = locked;
  state.submission.successCode = successCode;
  if (entryMode) state.submission.entryMode = entryMode;
  renderParticipantCodeUI();
}

function leaveEditMode(options = {}) {
  const { keepEntryMode = true } = options;
  state.submission.savedPredictions = {};
  setSubmissionMode("create", {
    participantCode: "",
    stageId: "",
    locked: false,
    entryMode: keepEntryMode ? state.submission.entryMode : "create",
    successCode: ""
  });
}

function fillParticipantForm(participante = {}) {
  restoreDraftFormValues({
    tipo_participante: participante.tipo_participante || PARTICIPANT_TYPES.JUGADOR,
    nombre: participante.nombre,
    apellido: participante.apellido,
    nombre_hijo: participante.nombre_hijo,
    apellido_hijo: participante.apellido_hijo,
    numero_socio: participante.numero_socio,
    categoria: participante.categoria,
    tira: participante.tira,
    whatsapp: participante.whatsapp,
    vinculo_baby: participante.vinculo_baby,
    jugador_vinculado_nombre: participante.jugador_vinculado_nombre,
    jugador_vinculado_apellido: participante.jugador_vinculado_apellido,
    categoria_vinculada: participante.categoria_vinculada,
    tira_vinculada: participante.tira_vinculada
  });
}

function fillPredictionSelections(predictions = []) {
  clearAllPredictionSelections();
  (predictions || []).forEach(item => {
    setSelectedPredictionSign(item.partido_id, item.sign);
  });
}

function clearSavedPredictions() {
  state.submission.savedPredictions = {};
}

function rememberSavedPredictions(predictions = []) {
  const next = { ...(state.submission.savedPredictions || {}) };
  (predictions || []).forEach(item => {
    const partidoId = String(item?.partido_id || "").trim();
    const sign = predictionSignToSubmissionValue(item?.sign || "");
    if (!partidoId || !sign) return;
    next[partidoId] = {
      partido_id: partidoId,
      sign,
      status: String(item?.status || "SAVED").trim() || "SAVED",
      code: String(item?.code || "").trim(),
      public_status: String(item?.public_status || "").trim() || "Pron\u00f3stico guardado",
      match_start_at: String(item?.match_start_at || "").trim(),
      cutoff_at: String(item?.cutoff_at || "").trim()
    };
  });
  state.submission.savedPredictions = next;
}

function getSavedPredictionForMatch(partidoId) {
  return state.submission.savedPredictions?.[partidoId] || null;
}

function scrollNodeIntoView(id) {
  const node = byId(id);
  if (!node) return;
  const scrollToNode = () => {
    node.scrollIntoView({
      block: node.offsetHeight > window.innerHeight * 0.72 ? "start" : "center",
      inline: "nearest",
      behavior: "auto"
    });
  };
  scrollToNode();
  window.setTimeout(scrollToNode, 80);
}

function validateTermsAcceptance() {
  if (isTermsAccepted()) return true;
  setSubmissionStatus("error", "Para participar ten\u00e9s que aceptar los T\u00e9rminos y Condiciones.");
  scrollNodeIntoView("termsConsentTitle");
  getTermsCheckbox()?.focus();
  return false;
}

function validateAccessCode() {
  const code = getParticipantAccessCode();
  if (isValidAccessCode(code)) return true;
  setSubmissionStatus("error", "El código de acceso no es válido. Pedíselo a la organización del Baby All Boys.");
  scrollNodeIntoView("participanteAccessCode");
  byId("participanteAccessCode")?.focus();
  return false;
}

function buildSubmissionMetadata() {
  const metadata = {
    origen: "baby-allboys",
    version: PRODE_SUBMISSION_VERSION,
    timestamp_cliente: new Date().toISOString(),
    submission_id: generateSubmissionId(),
    user_agent: navigator.userAgent,
    access_code: getParticipantAccessCode()
  };
  if (isTermsAccepted()) {
    const acceptedAt = syncTermsAcceptanceStorage() || new Date().toISOString();
    metadata.terms_accepted = true;
    metadata.terms_version = TERMS_VERSION;
    metadata.terms_accepted_at = acceptedAt;
  }
  return metadata;
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
    participanteTipo: participante.tipo_participante || PARTICIPANT_TYPES.JUGADOR,
    participanteNombre: participante.nombre,
    participanteApellido: participante.apellido,
    participanteVinculo: participante.vinculo_baby,
    participanteHijo: participante.jugador_vinculado_nombre || participante.nombre_hijo,
    participanteApellidoHijo: participante.jugador_vinculado_apellido || participante.apellido_hijo,
    participanteNumeroSocio: participante.numero_socio,
    participanteCategoria: participante.categoria_vinculada || participante.categoria,
    participanteTira: participante.tira_vinculada || participante.tira,
    participanteWhatsapp: participante.whatsapp
  };
  Object.entries(fieldMap).forEach(([id, value]) => {
    const node = byId(id);
    if (!node || value == null) return;
    node.value = String(value);
  });
  updateParticipantTypeUI();
}

function restoreDraftPredictionValues(pronosticos = {}) {
  Object.entries(pronosticos || {}).forEach(([partidoId, values]) => {
    setSelectedPredictionSign(partidoId, values?.sign || deriveSignFromGoals(values?.goles_local, values?.goles_visitante));
  });
}

function restoreDraftFromStorage() {
  const draft = readDraftStorage();
  restoreTermsAcceptanceState();
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
  state.submission.lastAction = "";
  state.submission.successCode = "";
  leaveEditMode({ keepEntryMode: false });
  clearAllPredictionSelections();
  updateParticipantTypeUI();
  restoreTermsAcceptanceState();
  setSubmissionStatus("", "");
  setCodeLookupStatus("", "");
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

function getMatchStartIso(partido) {
  const startIso = String(partido?.start_iso || "").trim();
  if (startIso) return startIso;
  const fecha = String(partido?.fecha || "").trim();
  const hora = String(partido?.hora || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "";
  const match = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hours = String(Math.max(0, Math.min(23, Number(match[1])))).padStart(2, "0");
  const minutes = String(match[2]).padStart(2, "0");
  return `${fecha}T${hours}:${minutes}:00-03:00`;
}

function getMatchStartDate(partido) {
  const iso = getMatchStartIso(partido);
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMatchCutoffDate(partido) {
  const start = getMatchStartDate(partido);
  if (!start) return null;
  return new Date(start.getTime() - MATCH_CUTOFF_MINUTES * 60 * 1000);
}

function getFirstProdeMatchDate() {
  const dates = state.partidos
    .map(getMatchStartDate)
    .filter(date => date instanceof Date && !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return dates.length ? dates[0] : null;
}

function getPredictionLockState(partido) {
  if (isStageLocked()) {
    return {
      code: "STAGE_CLOSED",
      locked: true,
      status: "ETAPA CERRADA",
      helper: "Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion."
    };
  }

  const savedPrediction = getSavedPredictionForMatch(partido?.id);
  if (savedPrediction) {
    return {
      code: "PREDICTION_ALREADY_LOCKED",
      locked: true,
      status: "GUARDADO",
      helper: "Este pronostico ya fue guardado y no se puede editar.",
      savedPrediction,
      cutoffAt: savedPrediction.cutoff_at || "",
      startAt: savedPrediction.match_start_at || ""
    };
  }

  const startDate = getMatchStartDate(partido);
  const cutoffDate = getMatchCutoffDate(partido);

  const hasValidTiming = startDate instanceof Date && cutoffDate instanceof Date;
  if (partido?.estado === "finalizado" || partido?.estado === "cerrado" || (hasValidTiming && Date.now() >= cutoffDate.getTime())) {
    return {
      code: "MATCH_CLOSED",
      locked: true,
      status: "PRONOSTICO CERRADO",
      helper: "La carga para este partido cerro 15 minutos antes del inicio.",
      cutoffAt: hasValidTiming ? cutoffDate.toISOString() : "",
      startAt: hasValidTiming ? startDate.toISOString() : ""
    };
  }

  const openStageId = getCurrentOpenStageId();
  const matchStageId = getMatchStageId(partido);
  if (!openStageId) {
    return {
      code: "NO_OPEN_STAGE",
      locked: true,
      status: "ETAPA NO DISPONIBLE",
      helper: "No pudimos validar la etapa abierta en este momento."
    };
  }

  if (matchStageId && matchStageId !== openStageId) {
    return {
      code: "STAGE_NOT_OPEN",
      locked: true,
      status: "ETAPA NO HABILITADA",
      helper: "Disponible cuando se abra esta etapa."
    };
  }

  if (isKnockoutPredictionMatch(partido) && !hasResolvedMatchTeams(partido)) {
    return {
      code: "KNOCKOUT_MATCH_NOT_READY",
      locked: true,
      status: "CRUCE AUN NO DEFINIDO",
      helper: state.matchesSource.remoteError || "Este cruce todavia no tiene definidos sus dos equipos."
    };
  }

  if (!hasValidTiming) {
    return {
      code: "MATCH_TIME_MISSING",
      locked: true,
      status: "HORARIO A CONFIRMAR",
      helper: "Este partido todavia no tiene horario confirmado para abrir la carga."
    };
  }

  return {
    code: getSelectedPredictionSign(partido?.id) ? "OPEN_SELECTED" : "OPEN",
    locked: false,
    status: getSelectedPredictionSign(partido?.id) ? "COMPLETO" : "LISTO PARA CARGAR",
    helper: "Podes guardar este pronostico hasta 15 minutos antes del inicio.",
    cutoffAt: cutoffDate.toISOString(),
    startAt: startDate.toISOString()
  };
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

function getCountdownParts(targetDate = getFirstProdeMatchDate()) {
  const target = targetDate instanceof Date ? targetDate : null;
  if (!(target instanceof Date) || Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { started: true, days: "00", hours: "00", minutes: "00", seconds: "00", target };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    started: false,
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    target
  };
}

function renderHeroCountdown() {
  const shell = document.querySelector(".hero-countdown-shell");
  const days = byId("countdownDays");
  const hours = byId("countdownHours");
  const minutes = byId("countdownMinutes");
  const seconds = byId("countdownSeconds");
  const heading = byId("countdownHeading");
  const caption = byId("countdownCaption");
  const grid = byId("countdownGrid");
  const eyebrow = shell?.querySelector(".countdown-copy .eyebrow");
  if (!shell || !days || !hours || !minutes || !seconds || !heading || !caption || !grid) return;

  let liveState = byId("countdownPostStart");
  if (!liveState) {
    liveState = document.createElement("div");
    liveState.id = "countdownPostStart";
    liveState.className = "countdown-post-start oculto";
    shell.appendChild(liveState);
  }

  const parts = getCountdownParts();
  if (!parts) {
    heading.textContent = "El fixture del Prode se esta actualizando.";
    caption.textContent = "Volve a entrar en un rato para ver el horario del primer partido.";
    grid.hidden = true;
    grid.classList.remove("is-started");
    shell.classList.remove("is-live");
    if (eyebrow) eyebrow.hidden = true;
    liveState.classList.add("oculto");
    liveState.innerHTML = "";
    return;
  }

  days.textContent = parts.days;
  hours.textContent = parts.hours;
  minutes.textContent = parts.minutes;
  seconds.textContent = parts.seconds;

  if (parts.started) {
    heading.textContent = "El Prode ya esta en juego";
    caption.textContent = "La carga de cada partido se cierra 15 minutos antes del inicio.";
    grid.hidden = true;
    grid.classList.add("is-started");
    shell.classList.add("is-live");
    if (eyebrow) eyebrow.hidden = true;
    liveState.classList.remove("oculto");
    liveState.innerHTML = `
      <p>Los pronosticos cargados ya estan compitiendo. Segui el ranking y los partidos.</p>
      <div class="countdown-live-actions">
        <a class="ghost-action" href="prode-mundial.html">Ver ranking</a>
        <a class="ghost-action" href="prode-mundial.html#partidos">Ver partidos</a>
      </div>
    `;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    return;
  } else {
    heading.textContent = "El Prode empieza en";
    caption.textContent = "La carga de cada partido se cierra 15 minutos antes del inicio.";
    grid.hidden = false;
    grid.classList.remove("is-started");
    shell.classList.remove("is-live");
    if (eyebrow) eyebrow.hidden = false;
    liveState.classList.add("oculto");
    liveState.innerHTML = "";
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

function hasResolvedMatchTeams(partido) {
  if (!partido) return false;
  if (!isKnockoutPredictionMatch(partido)) return true;
  if (partido.match_ready === true) return true;
  if (partido.match_ready === false) return false;
  return !renderTeamNote(partido.equipo_local) && !renderTeamNote(partido.equipo_visitante);
}

function getPredictionOptions(partido) {
  const localDisplay = formatTeamDisplayName(partido?.equipo_local);
  const visitanteDisplay = formatTeamDisplayName(partido?.equipo_visitante);
  if (isKnockoutPredictionMatch(partido)) {
    return [
      ["local", `Clasifica ${localDisplay}`],
      ["visitante", `Clasifica ${visitanteDisplay}`]
    ];
  }
  return [
    ["local", "Gana local"],
    ["empate", "Empate"],
    ["visitante", "Gana visitante"]
  ];
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

function openModalPanel(modalId, targetId = "") {
  const modal = byId(modalId);
  if (!modal) return;
  modal.classList.remove("oculto");
  const panel = modal.querySelector(".modal-panel");
  if (panel) panel.scrollTop = 0;
  if (targetId) {
    const target = byId(targetId);
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function openInfoModal(targetId = "modalInfoPremios") {
  openModalPanel("modalInfoProde", targetId);
}

function closeInfoModal() {
  byId("modalInfoProde")?.classList.add("oculto");
}

function openTermsModal() {
  openModalPanel("modalTermsProde");
}

function closeTermsModal() {
  byId("modalTermsProde")?.classList.add("oculto");
}

function renderPredictionCardStatus(partido) {
  return getPredictionLockState(partido).status;
}

function updatePredictionCardStates() {
  state.partidos.forEach(partido => {
    const statusNode = document.querySelector(`[data-card-status="${CSS.escape(partido.id)}"]`);
    const cardNode = document.querySelector(`[data-prediction-card="${CSS.escape(partido.id)}"]`);
    if (!statusNode || !cardNode) return;
    const lockState = getPredictionLockState(partido);
    const status = renderPredictionCardStatus(partido);
    const noteNode = cardNode.querySelector("[data-card-note]");
    statusNode.textContent = status;
    if (noteNode) noteNode.textContent = lockState.helper || "";
    cardNode.classList.toggle("complete", status === "COMPLETO");
    cardNode.classList.toggle("editable", !lockState.locked);
    cardNode.classList.toggle("saved", lockState.code === "PREDICTION_ALREADY_LOCKED");
    cardNode.classList.toggle("closed", lockState.locked && lockState.code !== "PREDICTION_ALREADY_LOCKED");
    cardNode.classList.toggle("locked", lockState.locked);

    cardNode.querySelectorAll(".prediction-sign-input").forEach(input => {
      input.disabled = lockState.locked;
    });
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
  const nextMatch = [...openMatches]
    .filter(partido => getMatchStartDate(partido))
    .sort((a, b) => getMatchStartDate(a).getTime() - getMatchStartDate(b).getTime())[0];
  const sedes = new Set(state.partidos.map(partido => partido.sede).filter(Boolean)).size;
  const instancias = new Set(state.partidos.map(partido => partido.instancia).filter(Boolean)).size;
  container.innerHTML = [
    ["Siguiente fecha", nextMatch ? formatMatchSchedule(nextMatch) : "A confirmar"],
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
  return partido?.estado === "abierto" && !isStageLocked();
}

function getPredictionStatusLabel(partido) {
  if (isStageLocked()) return "Etapa cerrada";
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
      const lockState = getPredictionLockState(partido);
      const editable = !lockState.locked;
      const disabledAttr = editable ? "" : "disabled";
      const stageLabel = [partido.instancia, partido.grupo].filter(Boolean).join(" | ") || "MUNDIAL 2026";
      const localDisplay = formatTeamDisplayName(partido.equipo_local);
      const visitanteDisplay = formatTeamDisplayName(partido.equipo_visitante);
      const options = getPredictionOptions(partido);
      return `
        <article class="prediction-entry-card ${editable ? "editable" : "locked"} ${lockState.code === "PREDICTION_ALREADY_LOCKED" ? "saved" : ""} ${lockState.locked && lockState.code !== "PREDICTION_ALREADY_LOCKED" ? "closed" : ""}" data-prediction-card="${esc(partido.id)}">
          <div class="prediction-entry-head">
            <span>${esc(stageLabel)}</span>
            <strong data-card-status="${esc(partido.id)}">${esc(lockState.status)}</strong>
          </div>
          <div class="prediction-entry-match">
            <div class="prediction-entry-team local">
              ${renderTeamBadge(partido.equipo_local)}
              <div class="prediction-entry-copy">
                <span class="team-name">${esc(localDisplay)}</span>
              </div>
            </div>
            <div class="prediction-entry-inputs prediction-sign-group" aria-label="${esc(isKnockoutPredictionMatch(partido) ? "Elegi quien clasifica" : "Elegi quien gana o si empatan")}">
              ${options.map(([value, label]) => `
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
          <p class="prediction-entry-note" data-card-note="${esc(partido.id)}">${esc(lockState.helper)}</p>
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
    const lockState = getPredictionLockState(partido);
    if (lockState.locked) return;
    if (isKnockoutPredictionMatch(partido) && sign === "empate") {
      incompletos.push(partido.id);
      return;
    }
    const signValue = predictionSignToSubmissionValue(sign);

    pronosticos.push({
      partido_id: partido.id,
      equipo_local: partido.equipo_local,
      equipo_visitante: partido.equipo_visitante,
      sign: signValue
    });
  });

  return { pronosticos, incompletos };
}

function readParticipantForm() {
  const type = getParticipantType();
  const nombre = byId("participanteNombre")?.value.trim() || "";
  const apellido = byId("participanteApellido")?.value.trim() || "";
  const nombreHijo = byId("participanteHijo")?.value.trim() || "";
  const apellidoHijo = byId("participanteApellidoHijo")?.value.trim() || "";
  const numeroSocio = byId("participanteNumeroSocio")?.value.trim() || "";
  const categoria = byId("participanteCategoria")?.value || "";
  const tira = byId("participanteTira")?.value || "";
  const whatsapp = byId("participanteWhatsapp")?.value.trim() || "";
  const vinculoBaby = byId("participanteVinculo")?.value || "";

  if (type === PARTICIPANT_TYPES.FAMILIAR) {
    return {
      tipo_participante: type,
      nombre,
      apellido,
      nombre_hijo: nombreHijo,
      apellido_hijo: apellidoHijo,
      numero_socio: "",
      categoria,
      tira,
      whatsapp,
      vinculo_baby: vinculoBaby,
      jugador_vinculado_nombre: nombreHijo,
      jugador_vinculado_apellido: apellidoHijo,
      categoria_vinculada: categoria,
      tira_vinculada: tira,
      access_code_validated: isValidAccessCode() ? "SI" : ""
    };
  }

  if (type === PARTICIPANT_TYPES.PROFESOR || type === PARTICIPANT_TYPES.DELEGADO) {
    return {
      tipo_participante: type,
      nombre,
      apellido,
      nombre_hijo: "",
      apellido_hijo: "",
      numero_socio: "",
      categoria: "",
      tira,
      whatsapp,
      vinculo_baby: "",
      jugador_vinculado_nombre: "",
      jugador_vinculado_apellido: "",
      categoria_vinculada: "",
      tira_vinculada: tira,
      access_code_validated: isValidAccessCode() ? "SI" : ""
    };
  }

  return {
    tipo_participante: PARTICIPANT_TYPES.JUGADOR,
    nombre,
    apellido,
    nombre_hijo: nombreHijo,
    apellido_hijo: apellidoHijo,
    numero_socio: numeroSocio,
    categoria,
    tira,
    whatsapp,
    vinculo_baby: "",
    jugador_vinculado_nombre: nombreHijo,
    jugador_vinculado_apellido: apellidoHijo,
    categoria_vinculada: categoria,
    tira_vinculada: tira,
    access_code_validated: isValidAccessCode() ? "SI" : ""
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

function buildCreatePayload(participante, pronosticos) {
  return {
    action: "create_participant_submission",
    participante,
    pronosticos,
    metadata: buildSubmissionMetadata()
  };
}

function buildLookupPayload(participantCode) {
  return {
    action: "get_participant_by_code",
    participant_code: normalizeParticipantCode(participantCode)
  };
}

function buildUpdatePayload(participantCode, stageId, pronosticos) {
  return {
    action: "update_stage_predictions",
    participant_code: normalizeParticipantCode(participantCode),
    stage_id: stageId,
    pronosticos,
    metadata: buildSubmissionMetadata()
  };
}

function setSubmissionStatus(type, message, options = {}) {
  const node = byId("estadoEnvio");
  if (!node) return;
  node.className = `submit-status ${type || ""}`.trim();
  if (options.html) {
    node.innerHTML = message || "";
    return;
  }
  node.textContent = message || "";
}

function formatPredictionStatusLabel(item = {}) {
  const partidoId = String(item?.partido_id || "").trim();
  const local = formatTeamDisplayName(item?.equipo_local || "");
  const visitante = formatTeamDisplayName(item?.equipo_visitante || "");
  const teams = [local, visitante].filter(Boolean).join(" vs ");
  return [partidoId, teams].filter(Boolean).join(" ");
}

function formatPredictionStatusList(items = []) {
  const seen = new Set();
  return (items || []).reduce((acc, item) => {
    const label = formatPredictionStatusLabel(item);
    if (!label || seen.has(label)) return acc;
    seen.add(label);
    acc.push(label);
    return acc;
  }, []);
}

function buildSubmissionStatusLine(label, items = []) {
  if (!items.length) return "";
  const matchList = formatPredictionStatusList(items);
  const detail = matchList.length ? ` (${matchList.map(esc).join(", ")})` : "";
  return `<strong>${esc(label)}:</strong> ${esc(items.length)}${detail}`;
}

function buildSubmissionOutcomeStatus(response, options = {}) {
  const mode = String(options?.mode || "").trim() || "created";
  const savedPredictions = Array.isArray(response?.saved_predictions) ? response.saved_predictions : [];
  const blockedPredictions = Array.isArray(response?.blocked_predictions) ? response.blocked_predictions : [];

  if (!blockedPredictions.length) {
    return {
      type: "success",
      message: mode === "updated" ? "Prode actualizado correctamente." : "Listo, tu Prode fue enviado.",
      html: false
    };
  }

  const closedPredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "MATCH_CLOSED");
  const lockedPredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "PREDICTION_ALREADY_LOCKED");
  const missingTimePredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "MATCH_TIME_MISSING");
  const stageBlockedPredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "STAGE_NOT_OPEN");
  const notReadyPredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "KNOCKOUT_MATCH_NOT_READY");
  const invalidKnockoutPredictions = blockedPredictions.filter(item => String(item?.code || "").trim() === "INVALID_KNOCKOUT_RESULT");
  const otherBlockedPredictions = blockedPredictions.filter(item => !["MATCH_CLOSED", "PREDICTION_ALREADY_LOCKED", "MATCH_TIME_MISSING", "STAGE_NOT_OPEN", "KNOCKOUT_MATCH_NOT_READY", "INVALID_KNOCKOUT_RESULT"].includes(String(item?.code || "").trim()));

  const lines = [
    buildSubmissionStatusLine("Partidos guardados", savedPredictions),
    buildSubmissionStatusLine("No guardados por horario cerrado", closedPredictions),
    buildSubmissionStatusLine("No guardados por etapa no habilitada", stageBlockedPredictions),
    buildSubmissionStatusLine("Cruces aun no definidos", notReadyPredictions),
    buildSubmissionStatusLine("No guardados por signo invalido", invalidKnockoutPredictions),
    buildSubmissionStatusLine("Ya guardados previamente", lockedPredictions),
    buildSubmissionStatusLine("No guardados por falta de horario", missingTimePredictions),
    buildSubmissionStatusLine("No guardados por otra validacion", otherBlockedPredictions)
  ].filter(Boolean);

  const title = savedPredictions.length
    ? (mode === "updated" ? "Actualizacion parcial." : "Guardado parcial.")
    : (mode === "updated" ? "No se actualizaron nuevos pronosticos." : "No se guardaron nuevos pronosticos.");

  return {
    type: "warning",
    message: `<strong>${esc(title)}</strong><br>${lines.join("<br>")}`,
    html: true
  };
}

function updateSubmissionSummary() {
  const node = byId("resumenCarga");
  if (!node) return;
  const participante = readParticipantForm();
  const { pronosticos, incompletos } = collectPredictionRows();
  const savedCount = Object.keys(state.submission.savedPredictions || {}).length;
  const participantePrincipal = [participante.nombre, participante.apellido].filter(Boolean).join(" ");
  const jugadorVinculado = [participante.jugador_vinculado_nombre || participante.nombre_hijo, participante.jugador_vinculado_apellido || participante.apellido_hijo].filter(Boolean).join(" ");
  const categoria = [participante.categoria_vinculada || participante.categoria, participante.tira_vinculada || participante.tira].filter(Boolean).join(" | ");
  const codeText = state.submission.participantCode || "Sin c\u00f3digo";
  const typeLabels = {
    JUGADOR: "Jugador/a",
    FAMILIAR: "Familiar",
    PROFESOR: "Profesor",
    DELEGADO: "Delegado"
  };
  const typeLabel = typeLabels[participante.tipo_participante] || "Participante";
  const secondaryText = participante.tipo_participante === PARTICIPANT_TYPES.JUGADOR
    ? [participante.nombre, participante.apellido].filter(Boolean).join(" ") || "Adulto pendiente"
    : (jugadorVinculado || participante.whatsapp || "Vínculo pendiente");

  node.innerHTML = `
    <article class="summary-card compact">
      <span>${esc(typeLabel)}</span>
      <strong>${esc(participantePrincipal || "Pendiente")}</strong>
      <small>${esc(secondaryText)}</small>
    </article>
    <article class="summary-card compact">
      <span>Vinculación</span>
      <strong>${esc(categoria || "Pendiente")}</strong>
      <small>${esc(isEditMode() ? codeText : (jugadorVinculado || "Sin vínculo cargado"))}</small>
    </article>
    <article class="summary-card compact">
      <span>Pron&oacute;sticos listos</span>
      <strong>${esc(pronosticos.length + savedCount)}</strong>
      <small>${esc(`${savedCount} guardados y ${incompletos.length} incompletos`)}</small>
    </article>
  `;
}

function updateSubmissionButton() {
  const button = byId("btnConfirmarProde");
  if (!button) return;

  if (state.submission.sending) {
    button.disabled = true;
    button.textContent = isEditMode() ? "Actualizando Prode..." : "Enviando Prode...";
    return;
  }

  if (isProdeClosed() || isStageLocked()) {
    button.disabled = true;
    button.textContent = "Etapa cerrada";
    return;
  }

  if (isSheetsEndpointConfigured() && !getCurrentOpenStageId()) {
    button.disabled = true;
    button.textContent = "Etapa no disponible";
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    button.disabled = true;
    button.textContent = isEditMode() ? "Actualizar mi Prode" : "Confirmar mi Prode";
    return;
  }

  button.disabled = false;
  button.textContent = isEditMode() ? "Actualizar mi Prode" : "Confirmar mi Prode";
}

function renderEndpointNotice() {
  const node = byId("prodeNotice");
  if (!node) return;
  const cierreTexto = formatCierre();

  if (isProdeClosed() || isStageLocked()) {
    node.className = "prode-alert warning";
    node.innerHTML = `<strong>Esta etapa ya est&aacute; cerrada.</strong> Si necesit&aacute;s corregir algo, habl&aacute; con la organizaci&oacute;n.${cierreTexto ? ` <span>Cerr&oacute; el ${esc(cierreTexto)}.</span>` : ""}`;
    return;
  }

  if (isSheetsEndpointConfigured()) {
    const openStageId = getCurrentOpenStageId();
    const openStageLabel = String(state.openStage?.stage_label || state.openStage?.stage_id || "").trim();
    if (!openStageId) {
      node.className = "prode-alert warning";
      node.innerHTML = "<strong>No pudimos validar la etapa abierta.</strong> <span>Probá de nuevo en unos segundos antes de cargar pronósticos.</span>";
      return;
    }

    if (state.matchesSource.remoteError) {
      node.className = "prode-alert warning";
      node.innerHTML = `<strong>Etapa abierta: ${esc(openStageLabel || openStageId)}.</strong> <span>${esc(state.matchesSource.remoteError)}</span>`;
      return;
    }

    node.className = "prode-alert ok";
    if (isEditMode()) {
      node.innerHTML = `<strong>Tu c&oacute;digo ya est&aacute; activo para esta etapa.</strong> <span>Cada partido cierra 15 minutos antes del inicio y lo que ya guardaste no se puede editar.</span>`;
    } else if (cierreTexto) {
      node.innerHTML = `<strong>Etapa abierta: ${esc(openStageLabel || openStageId)}.</strong> <span>Ten&eacute;s tiempo hasta el ${esc(cierreTexto)} para participar. Cada partido cierra 15 minutos antes del inicio.</span>`;
    } else {
      node.innerHTML = `<strong>Etapa abierta: ${esc(openStageLabel || openStageId)}.</strong> <span>Complet&aacute; tus datos y particip&aacute; del Prode. Cada partido cierra 15 minutos antes del inicio.</span>`;
    }
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

  const logPayload = {
    status: response.status,
    ok: response.ok,
    responseText: raw,
    responseJson: parsed,
    payload
  };

  if (!response.ok) {
    console.error("[Prode submit]", logPayload);
    const error = new Error(parsed?.error || raw || `HTTP ${response.status}`);
    error.code = parsed?.error_code || `HTTP_${response.status}`;
    throw error;
  }
  if (parsed && parsed.ok === false) {
    if (!EXPECTED_PRODE_ERROR_CODES.has(parsed.error_code || "")) {
      console.error("[Prode submit]", logPayload);
    }
    const error = new Error(parsed.error || "El Apps Script rechazo el envio.");
    error.code = parsed.error_code || "APPS_SCRIPT_ERROR";
    error.data = parsed;
    throw error;
  }
  return parsed || raw;
}

async function fetchOpenStage() {
  state.openStage = {
    stage_id: "",
    stage_label: "",
    status: "",
    editable_now: false,
    editable_until: "",
    loaded: true,
    error: ""
  };

  if (!isSheetsEndpointConfigured()) {
    return state.openStage;
  }

  try {
    const response = await sendSubmissionToSheets({ action: "get_open_stage" });
    const stage = response?.stage || {};
    state.openStage = {
      stage_id: String(stage?.stage_id || "").trim(),
      stage_label: String(stage?.stage_label || "").trim(),
      status: String(stage?.status || "").trim(),
      editable_now: Boolean(stage?.editable_now),
      editable_until: String(stage?.editable_until || "").trim(),
      loaded: true,
      error: ""
    };
  } catch (error) {
    console.warn("[Prode open stage]", error);
    state.openStage = {
      stage_id: "",
      stage_label: "",
      status: "",
      editable_now: false,
      editable_until: "",
      loaded: true,
      error: String(error?.message || "No pudimos validar la etapa abierta.").trim()
    };
  }

  return state.openStage;
}

async function loadMatches() {
  const localMatches = await fetch("data/prode/partidos.json", { cache: "no-store" }).then(response => {
    if (!response.ok) throw new Error("partidos");
    return response.json();
  });

  state.matchesSource = {
    remoteLoaded: false,
    remoteError: ""
  };

  if (!isSheetsEndpointConfigured()) {
    return Array.isArray(localMatches) ? localMatches : [];
  }

  try {
    const response = await sendSubmissionToSheets({ action: "get_public_matches" });
    const matches = Array.isArray(response?.matches) ? response.matches : [];
    const remoteStage = response?.open_stage || null;
    if (remoteStage && !state.openStage?.stage_id) {
      state.openStage = {
        stage_id: String(remoteStage?.stage_id || "").trim(),
        stage_label: String(remoteStage?.stage_label || "").trim(),
        status: String(remoteStage?.status || "").trim(),
        editable_now: Boolean(remoteStage?.editable_now),
        editable_until: String(remoteStage?.editable_until || "").trim(),
        loaded: true,
        error: ""
      };
    }
    state.matchesSource = {
      remoteLoaded: true,
      remoteError: ""
    };
    return matches.length ? matches : (Array.isArray(localMatches) ? localMatches : []);
  } catch (error) {
    console.warn("[Prode public matches]", error);
    state.matchesSource = {
      remoteLoaded: false,
      remoteError: "No pudimos actualizar la llave. Proba nuevamente."
    };
    return Array.isArray(localMatches) ? localMatches.map(match => ({
      ...match,
      stage_id: getMatchStageId(match),
      match_ready: !isKnockoutPredictionMatch(match) && true
    })) : [];
  }
}

async function fetchPublicRanking() {
  if (!shouldUseLivePublicRanking()) {
    state.publicRanking = {
      loading: false,
      loaded: true,
      error: "",
      generatedAt: "",
      totalParticipantes: 0,
      totalResultadosFinales: 0,
      top5: [],
      rankingGeneral: [],
      rankingPorCategoria: {}
    };
    return state.publicRanking;
  }

  state.publicRanking.loading = true;
  try {
    const response = await sendSubmissionToSheets({ action: "get_public_ranking" });
    const rankingGeneral = Array.isArray(response?.ranking_general) ? response.ranking_general : [];
    const top5 = Array.isArray(response?.top5) ? response.top5 : rankingGeneral.slice(0, 5);
    state.publicRanking = {
      loading: false,
      loaded: true,
      error: "",
      generatedAt: String(response?.generated_at || "").trim(),
      totalParticipantes: Number(response?.total_participantes || 0),
      totalResultadosFinales: Number(response?.total_resultados_finales || 0),
      top5,
      rankingGeneral,
      rankingPorCategoria: response?.ranking_por_categoria && typeof response.ranking_por_categoria === "object"
        ? response.ranking_por_categoria
        : {}
    };
  } catch (error) {
    console.error("[Prode ranking]", error);
    state.publicRanking = {
      loading: false,
      loaded: true,
      error: String(error?.message || "No pudimos actualizar el ranking ahora.").trim(),
      generatedAt: "",
      totalParticipantes: 0,
      totalResultadosFinales: 0,
      top5: [],
      rankingGeneral: [],
      rankingPorCategoria: {}
    };
  }
  return state.publicRanking;
}

function getPublicRankingRows() {
  return Array.isArray(state.publicRanking?.rankingGeneral) ? state.publicRanking.rankingGeneral : [];
}

function getPublicRankingTop5() {
  return Array.isArray(state.publicRanking?.top5) ? state.publicRanking.top5 : [];
}

function getPublicRankingBestCategory() {
  const entries = Object.entries(state.publicRanking?.rankingPorCategoria || {});
  if (!entries.length) return "";
  return entries
    .map(([categoria, rows]) => ({
      categoria,
      total: (Array.isArray(rows) ? rows : []).reduce((acc, row) => acc + Number(row?.puntos || 0), 0)
    }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "es"))[0]?.categoria || "";
}

function formatPublicRankingTimestamp(value) {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildPublicRankingCard(row) {
  return `
    <article class="ranking-row-card">
      <div class="ranking-row-position">${esc(row.posicion)}</div>
      <div class="ranking-row-main">
        <strong>${esc(row.display_name)}</strong>
        <p>${esc(row.categoria_display)} · ${esc(row.tira_display)}</p>
      </div>
      <div class="ranking-row-side">
        <strong>${esc(row.puntos)} pts</strong>
        <span>${esc(row.aciertos)} aciertos · ${esc(row.computados)} computados</span>
      </div>
    </article>
  `;
}

function buildPublicRankingEmpty(message) {
  return `<div class="empty public-ranking-empty">${esc(message)}</div>`;
}

function applyLoadedParticipant(response, options = {}) {
  const { showStatus = true } = options;
  const participant = response?.participant || {};
  const stage = response?.stage || null;
  const predictions = Array.isArray(response?.predictions) ? response.predictions : [];
  const participantCode = normalizeParticipantCode(participant.participant_code || response?.participant_code || byId("participantCodeInput")?.value || "");
  const readonlyMessage = String(response?.readonly_message || "").trim();
  const locked = !stage?.editable_now || Boolean(readonlyMessage);

  fillParticipantForm(participant);
  clearSavedPredictions();
  rememberSavedPredictions(predictions);
  fillPredictionSelections(predictions);
  state.submission.submitted = false;
  state.submission.lastAction = "";
  state.submission.successCode = "";
  setSubmissionMode("edit", {
    participantCode,
    stageId: stage?.stage_id || "",
    locked,
    entryMode: "code"
  });
  if (participantCode) writeParticipantCodeStorage(participantCode);
  saveDraftNow();
  setCodeLookupStatus("", "");

  if (showStatus) {
    if (locked) {
      setSubmissionStatus("warning", readonlyMessage || "Esta etapa ya est\u00e1 cerrada. Si necesit\u00e1s corregir algo, habl\u00e1 con la organizaci\u00f3n.");
    } else {
      setSubmissionStatus("success", "Prode recuperado correctamente.");
    }
  }

  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  renderEndpointNotice();
}

async function lookupParticipantCode(rawCode, options = {}) {
  const { silent = false } = options;
  const normalizedCode = normalizeParticipantCode(rawCode);
  const input = byId("participantCodeInput");
  if (input) input.value = normalizedCode;

  if (!normalizedCode) {
    const message = "Ingres\u00e1 tu c\u00f3digo para continuar.";
    setCodeLookupStatus(message, "error");
    if (!silent) setSubmissionStatus("error", message);
    return null;
  }

  setCodeLookupStatus("Buscando tu Prode...", "info");
  if (!silent) setSubmissionStatus("info", "Buscando tu Prode guardado...");

  try {
    const response = await sendSubmissionToSheets(buildLookupPayload(normalizedCode));
    if (response?.ok) {
      applyLoadedParticipant(response, { showStatus: !silent });
      scrollNodeIntoView("currentCodeBanner");
      return response;
    }
    return null;
  } catch (error) {
    const code = String(error?.code || "").trim();
    if (code === "CODE_NOT_FOUND") {
      setCodeLookupStatus("No encontramos un Prode asociado a ese c\u00f3digo.", "error");
      if (!silent) setSubmissionStatus("error", "No encontramos un Prode asociado a ese c\u00f3digo.");
      return null;
    }
    if (code === "STAGE_CLOSED") {
      setCodeLookupStatus("Esta etapa ya est\u00e1 cerrada. Si necesit\u00e1s corregir algo, habl\u00e1 con la organizaci\u00f3n.", "warning");
      if (!silent) setSubmissionStatus("warning", "Esta etapa ya est\u00e1 cerrada. Si necesit\u00e1s corregir algo, habl\u00e1 con la organizaci\u00f3n.");
      return null;
    }
    const message = String(error?.message || "").trim() || "No pudimos recuperar tu Prode. Proba de nuevo.";
    setCodeLookupStatus(message, "error");
    if (!silent) setSubmissionStatus("error", message);
    return null;
  }
}

async function handleSubmission(event) {
  event.preventDefault();
  if (state.submission.sending) return;
  const editing = isEditMode();

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
      : (publicErrors.includes(message) ? message : (message || "No pudimos enviar tu Prode. Probá de nuevo."));
    setSubmissionStatus("error", publicMessage);
  } finally {
    state.submission.sending = false;
    updateSubmissionButton();
  }
}

function handleSubmissionInputChange(event) {
  if (event?.target?.id === "termsAccepted") {
    syncTermsAcceptanceStorage();
  }
  if (state.submission.submitted) {
    state.submission.submitted = false;
    setSubmissionStatus("info", "Hiciste cambios en el formulario. Revisalos y confirmá de nuevo.");
  }
  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  scheduleDraftSave();
}

function focusCodeInput() {
  const input = byId("participantCodeInput");
  if (!input) return;
  input.focus();
  input.select();
}

function showCodeEntry() {
  state.submission.entryMode = "code";
  leaveEditMode({ keepEntryMode: true });
  renderParticipantCodeUI();
  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  renderEndpointNotice();
  scrollNodeIntoView("codeLookupPanel");
  window.setTimeout(focusCodeInput, 40);
}

async function copyParticipantCode(code, statusTarget = "submission") {
  const normalized = normalizeParticipantCode(code);
  if (!normalized) return false;
  try {
    await navigator.clipboard.writeText(normalized);
    if (statusTarget === "lookup") {
      setCodeLookupStatus("C\u00f3digo copiado.", "success");
    } else {
      setSubmissionStatus("success", "C\u00f3digo copiado.");
    }
    return true;
  } catch (error) {
    if (statusTarget === "lookup") {
      setCodeLookupStatus("No pudimos copiar el c\u00f3digo autom\u00e1ticamente.", "warning");
    } else {
      setSubmissionStatus("warning", "No pudimos copiar el c\u00f3digo autom\u00e1ticamente.");
    }
    return false;
  }
}

function bindParticipantCodeEvents() {
  byId("entryModeShell")?.addEventListener("click", event => {
    const modeButton = event.target.closest("[data-entry-mode]");
    if (modeButton) {
      state.submission.entryMode = modeButton.dataset.entryMode === "code" ? "code" : "create";
      if (isEditMode()) {
        leaveEditMode({ keepEntryMode: true });
      }
      if (state.submission.entryMode === "create") {
        setCodeLookupStatus("", "");
      }
      setSubmissionStatus("", "");
      renderParticipantCodeUI();
      updateSubmissionSummary();
      updatePredictionCardStates();
      updateSubmissionButton();
      renderEndpointNotice();
      if (state.submission.entryMode === "code") {
        window.setTimeout(focusCodeInput, 40);
      }
      return;
    }

    if (event.target.closest("#btnUsarCodigoGuardado")) {
      const savedCode = readParticipantCodeStorage();
      if (savedCode) lookupParticipantCode(savedCode);
      return;
    }

    if (event.target.closest("#btnMostrarIngresoCodigo") || event.target.closest("[data-show-code-entry]")) {
      showCodeEntry();
      return;
    }

    if (event.target.closest("#btnCopiarCodigoActual")) {
      copyParticipantCode(state.submission.participantCode);
      return;
    }

    if (event.target.closest("#btnCopiarCodigoNuevo")) {
      copyParticipantCode(state.submission.successCode || state.submission.participantCode);
      return;
    }

    if (event.target.closest("#btnBuscarCodigo")) {
      lookupParticipantCode(byId("participantCodeInput")?.value || "");
    }
  });

  byId("participantCodeInput")?.addEventListener("input", event => {
    event.target.value = String(event.target.value || "").toUpperCase().replace(/[^A-Z0-9\- ]/g, "");
    setCodeLookupStatus("", "");
  });

  byId("participantCodeInput")?.addEventListener("blur", event => {
    event.target.value = normalizeParticipantCode(event.target.value);
  });

  byId("participanteAccessCode")?.addEventListener("input", event => {
    event.target.value = String(event.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  byId("participantCodeInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      lookupParticipantCode(event.target.value || "");
    }
  });
}

async function handleSubmission(event) {
  event.preventDefault();
  if (state.submission.sending) return;
  const editing = isEditMode();

  const participante = readParticipantForm();
  if (!participante.apellido_hijo) {
    byId("participanteApellidoHijo")?.focus();
    setSubmissionStatus("error", "Completa el apellido del chico/a.");
    return;
  }

  const form = byId("prodeForm");
  if (!form?.reportValidity()) {
    setSubmissionStatus("error", "Revisa los datos obligatorios antes de confirmar.");
    return;
  }

  if (!validateAccessCode()) {
    return;
  }

  if (!validateTermsAcceptance()) {
    return;
  }

  if (isProdeClosed()) {
    setSubmissionStatus("warning", "El Prode cerr\u00f3. Ya no se reciben pron\u00f3sticos.");
    updateSubmissionButton();
    renderEndpointNotice();
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    setSubmissionStatus("warning", "El Prode todav\u00eda no est\u00e1 habilitado para recibir inscripciones.");
    updateSubmissionButton();
    return;
  }

  if (isStageLocked()) {
    setSubmissionStatus("warning", "Esta etapa ya est\u00e1 cerrada. Si necesit\u00e1s corregir algo, habl\u00e1 con la organizaci\u00f3n.");
    updateSubmissionButton();
    renderEndpointNotice();
    return;
  }

  const { pronosticos, incompletos } = collectPredictionRows();
  if (incompletos.length) {
    setSubmissionStatus("error", "Revisa los pronosticos antes de confirmar tu Prode.");
    return;
  }
  if (!pronosticos.length) {
    const hasSavedPredictions = Object.keys(state.submission.savedPredictions || {}).length > 0;
    setSubmissionStatus(
      hasSavedPredictions ? "warning" : "error",
      hasSavedPredictions
        ? "No hay partidos disponibles para guardar. Los pronosticos ya guardados o cerrados no se pueden modificar."
        : "Elegi al menos un signo antes de confirmar tu Prode."
    );
    return;
  }

  const payload = editing
    ? buildUpdatePayload(state.submission.participantCode, state.submission.stageId, pronosticos)
    : buildCreatePayload(participante, pronosticos);

  state.submission.sending = true;
  updateSubmissionButton();
  setSubmissionStatus("info", isEditMode() ? "Estamos actualizando tu Prode..." : "Estamos enviando tu Prode...");

  try {
    const response = await sendSubmissionToSheets(payload);
    const savedPredictions = Array.isArray(response?.saved_predictions) ? response.saved_predictions : [];
    const blockedPredictions = Array.isArray(response?.blocked_predictions) ? response.blocked_predictions : [];
    const outcomeStatus = buildSubmissionOutcomeStatus(response, {
      mode: String(response?.mode || (editing ? "updated" : "created")).trim() || (editing ? "updated" : "created")
    });
    rememberSavedPredictions(savedPredictions);
    rememberSavedPredictions(blockedPredictions.filter(item => String(item?.code || "").trim() === "PREDICTION_ALREADY_LOCKED"));
    state.submission.submitted = false;
    state.submission.lastAction = response?.mode || (editing ? "updated" : "created");
    removeDraftStorage();
    window.clearTimeout(draftSaveTimer);
    setDraftNotice("", "");

    if (response?.participant_code) {
      writeParticipantCodeStorage(response.participant_code);
    }

    if (response?.mode === "created" && response?.participant_code) {
      setSubmissionMode("edit", {
        participantCode: response.participant_code,
        stageId: response?.stage_id || "",
        locked: false,
        entryMode: "create",
        successCode: response.participant_code
      });
      if (response?.saved_count > 0 && response?.blocked_count > 0) {
        setSubmissionStatus("warning", "Guardamos tus pronosticos disponibles. Los partidos ya guardados o cerrados no pueden modificarse.");
      } else if (response?.saved_count === 0 && response?.blocked_count > 0) {
        setSubmissionStatus("warning", "No habia pronosticos disponibles para guardar. Los partidos ya guardados o cerrados no pueden modificarse.");
      } else if (response?.participant_code) {
        setSubmissionStatus("success", "Listo, tu Prode fue enviado.");
      }
      scrollNodeIntoView("participantCodeSuccess");
    } else if (response?.mode === "created" && !response?.participant_code) {
      setSubmissionMode("create", {
        participantCode: "",
        stageId: response?.stage_id || "",
        locked: false,
        entryMode: "create",
        successCode: ""
      });
      setSubmissionStatus("warning", "El Prode se envió, pero no recibimos el código. Avisá a la organización.");
    } else if (response?.mode === "updated") {
      setSubmissionMode("edit", {
        participantCode: state.submission.participantCode || response?.participant_code || "",
        stageId: response?.stage_id || state.submission.stageId || "",
        locked: false,
        entryMode: state.submission.entryMode,
        successCode: ""
      });
      if (response?.saved_count > 0 && response?.blocked_count > 0) {
        setSubmissionStatus("warning", "Guardamos los partidos que seguian abiertos. Los ya guardados o cerrados no cambiaron.");
      } else if (response?.saved_count === 0 && response?.blocked_count > 0) {
        setSubmissionStatus("warning", "No habia partidos disponibles para actualizar. Los ya guardados o cerrados no se pueden modificar.");
      } else {
        setSubmissionStatus("success", "Prode actualizado correctamente.");
      }
      scrollNodeIntoView("currentCodeBanner");
    } else {
      setSubmissionStatus("success", "Listo, tu Prode fue enviado.");
    }
  } catch (error) {
    const code = String(error?.code || "").trim();
    const message = String(error?.message || "").trim();

    if (code === "DUPLICATE_WITHOUT_CODE") {
      state.submission.entryMode = "code";
      renderParticipantCodeUI();
      setSubmissionStatus(
        "error",
        'Ya existe un Prode para este jugador/a. Ingres\u00e1 tu c\u00f3digo para verlo o editarlo. <button type="button" class="inline-status-action" data-show-code-entry>Ingresar c\u00f3digo</button>',
        { html: true }
      );
      scrollNodeIntoView("estadoEnvio");
    } else if (code === "CODE_NOT_FOUND") {
      setSubmissionStatus("error", "No encontramos un Prode asociado a ese c\u00f3digo.");
    } else if (code === "STAGE_CLOSED") {
      state.submission.locked = true;
      renderParticipantCodeUI();
      setSubmissionStatus("warning", "Esta etapa ya est\u00e1 cerrada. Si necesit\u00e1s corregir algo, habl\u00e1 con la organizaci\u00f3n.");
    } else if (code === "STAGE_NOT_OPEN") {
      setSubmissionStatus("warning", "Ese partido pertenece a una etapa que todav\u00eda no est\u00e1 habilitada.");
    } else if (code === "KNOCKOUT_MATCH_NOT_READY") {
      setSubmissionStatus("warning", "Ese cruce todav\u00eda no tiene definidos sus dos equipos.");
    } else if (code === "INVALID_KNOCKOUT_RESULT") {
      setSubmissionStatus("warning", "En eliminaci\u00f3n directa solo pod\u00e9s elegir qu\u00e9 equipo clasifica.");
    } else {
      setSubmissionStatus("error", message || "No pudimos enviar tu Prode. Proba de nuevo.");
    }
  } finally {
    state.submission.sending = false;
    updateSubmissionSummary();
    updatePredictionCardStates();
    updateSubmissionButton();
    renderEndpointNotice();
  }
}

function handleSubmissionInputChange(event) {
  if (event?.target?.id === "participanteTipo") {
    updateParticipantTypeUI();
  }
  if (state.submission.submitted) {
    state.submission.submitted = false;
    state.submission.lastAction = "";
    setSubmissionStatus("info", "Hiciste cambios en el formulario. Revisalos y confirma de nuevo.");
  }
  if (state.submission.successCode) {
    state.submission.successCode = "";
    renderParticipantCodeUI();
  }
  updateSubmissionSummary();
  updatePredictionCardStates();
  updateSubmissionButton();
  renderEndpointNotice();
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

function renderFilters() {
  const filtersShell = byId("filtrosProde")?.closest(".controls");
  if (filtersShell) {
    filtersShell.classList.add("oculto");
  }
}

function renderSummary() {
  const container = byId("resumenProde");
  if (!container) return;
  const abiertos = state.partidos.filter(partido => partido.estado === "abierto").length;
  const finalizados = Number(state.publicRanking?.totalResultadosFinales || 0);
  const participantesReales = Number(state.publicRanking?.totalParticipantes || 0);
  const liderActual = getPublicRankingRows()[0];
  const mejorCategoria = getPublicRankingBestCategory();
  const actualizacion = formatPublicRankingTimestamp(state.publicRanking?.generatedAt);

  container.innerHTML = [
    ["Participantes reales", participantesReales],
    ["Partidos del Prode", state.partidos.length],
    ["Abiertos", abiertos],
    ["Finalizados", finalizados],
    ["Top actual", liderActual?.display_name || "-"],
    ["Categoria caliente", mejorCategoria || "-"],
    ["Ranking actualizado", actualizacion || "Pendiente"]
  ].map(([label, value]) => `<article class="summary-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
}

function renderRanking() {
  const titleNode = byId("tituloRanking");
  const listNode = byId("rankingLista");
  if (!titleNode || !listNode) return;
  const top5 = getPublicRankingTop5();
  const rows = getPublicRankingRows();
  titleNode.textContent = "Top 5 parcial";

  if (state.publicRanking.loading) {
    listNode.innerHTML = buildPublicRankingEmpty("Actualizando ranking...");
    return;
  }

  if (state.publicRanking.error) {
    listNode.innerHTML = buildPublicRankingEmpty(state.publicRanking.error);
    return;
  }

  if (!Number(state.publicRanking?.totalResultadosFinales || 0) || !rows.length) {
    listNode.innerHTML = buildPublicRankingEmpty("Todavia no hay resultados computados.");
    return;
  }

  const moreRows = rows.slice(5);
  listNode.innerHTML = `
    <div class="public-ranking-shell">
      <div class="public-ranking-meta">
        <p>Ranking actualizado con resultados cargados.</p>
        <small>Sujeto a revision de resultados.</small>
      </div>
      <div class="ranking-public-list">
        ${top5.map(buildPublicRankingCard).join("")}
      </div>
      ${moreRows.length ? `
        <div class="ranking-table-shell">
          <div class="ranking-table-head">
            <div>
              <strong>Mas posiciones</strong>
              <p>Se muestran solo participantes reales y datos seguros.</p>
            </div>
          </div>
          <div class="ranking-public-list">
            ${moreRows.map(buildPublicRankingCard).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderShareCard() {
  const container = byId("cardViral");
  if (!container) return;
  container.classList.add("oculto");
  container.innerHTML = "";
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
      title: "Resultados reales",
      text: "Panel oculto para cargar signos reales y actualizar el ranking publico automaticamente.",
      href: "admin-prode-resultados.html",
      code: "admin-prode-resultados.html"
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
  updateParticipantTypeUI();
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

  byId("modalTermsProde")?.addEventListener("click", event => {
    if (event.target.closest("[data-close-terms]")) {
      closeTermsModal();
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

  document.addEventListener("click", event => {
    if (!event.target.closest("[data-open-terms]")) return;
    event.preventDefault();
    openTermsModal();
  });

  document.addEventListener("click", event => {
    if (event.target.closest("[data-show-code-entry]")) {
      event.preventDefault();
      showCodeEntry();
    }
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
      closeTermsModal();
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
    const [participantes] = await Promise.all([
      fetch("data/prode/participantes.json", { cache: "no-store" }).then(response => {
        if (!response.ok) throw new Error("participantes");
        return response.json();
      })
    ]);
    await fetchOpenStage();
    const partidos = await loadMatches();

    state.participantes = Array.isArray(participantes) ? participantes : [];
    state.partidos = Array.isArray(partidos) ? partidos : [];
    state.ranking = calculateRanking();
    await fetchPublicRanking();

    byId("estadoCarga").className = "status-card ok";
    startHeroCountdown();
    renderAll();
    restoreDraftFromStorage();
    renderParticipantCodeUI();
    updateSubmissionSummary();
    updatePredictionCardStates();
    updateSubmissionButton();
    bindStaticEvents();
    bindParticipantCodeEvents();
    bindDynamicFilters();
    renderNews();
  } catch (error) {
    byId("estadoCarga").className = "status-card error";
    byId("estadoCarga").textContent = "No se pudieron cargar los datos del Prode.";
    console.error(error);
  }
}

function updateParticipantTypeUI() {
  const type = getParticipantType();
  const isPlayer = type === PARTICIPANT_TYPES.JUGADOR;
  const isFamily = type === PARTICIPANT_TYPES.FAMILIAR;
  const isProfessor = type === PARTICIPANT_TYPES.PROFESOR;
  const isDelegate = type === PARTICIPANT_TYPES.DELEGADO;
  const help = byId("helpParticipanteNumeroSocio");

  setFieldVisibility("fieldParticipanteVinculo", isFamily);
  setFieldVisibility("fieldParticipanteHijo", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteApellidoHijo", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteNumeroSocio", true);
  setFieldVisibility("fieldParticipanteCategoria", isPlayer || isFamily);
  setFieldVisibility("fieldParticipanteTira", true);

  setFieldRequired("participanteVinculo", isFamily);
  setFieldRequired("participanteHijo", isPlayer || isFamily);
  setFieldRequired("participanteApellidoHijo", isPlayer || isFamily);
  setFieldRequired("participanteNumeroSocio", true);
  setFieldRequired("participanteCategoria", isPlayer || isFamily);
  setFieldRequired("participanteTira", isPlayer || isFamily);
  setFieldRequired("participanteWhatsapp", isFamily || isProfessor || isDelegate);

  if (help) {
    help.textContent = "Es obligatorio para participar y poder reclamar premios.";
  }

  if (isPlayer) {
    setFieldLabelText("labelParticipanteNombre", "Nombre adulto");
    setFieldLabelText("labelParticipanteApellido", "Apellido adulto");
    setFieldLabelText("labelParticipanteHijo", "Nombre chico/a");
    setFieldLabelText("labelParticipanteApellidoHijo", "Apellido del chico/a");
    setFieldLabelText("labelParticipanteNumeroSocio", "Numero de socio del jugador/a");
    setFieldLabelText("labelParticipanteCategoria", "Categoria");
    setFieldLabelText("labelParticipanteTira", "Tira / equipo");
    setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp opcional");
    setParticipantTypeNotice("", "");
    return;
  }

  if (isFamily) {
    setFieldLabelText("labelParticipanteNombre", "Nombre del adulto participante");
    setFieldLabelText("labelParticipanteApellido", "Apellido del adulto participante");
    setFieldLabelText("labelParticipanteHijo", "Nombre del jugador/a vinculado");
    setFieldLabelText("labelParticipanteApellidoHijo", "Apellido del jugador/a vinculado");
    setFieldLabelText("labelParticipanteNumeroSocio", "Numero de socio del jugador/a vinculado");
    setFieldLabelText("labelParticipanteCategoria", "Categoria del jugador/a vinculado");
    setFieldLabelText("labelParticipanteTira", "Tira / equipo del jugador/a vinculado");
    setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp");
    setParticipantTypeNotice("Esta opcion es solo para familiares o adultos responsables vinculados a un jugador/a de Baby All Boys.", "info");
    return;
  }

  const roleLabel = isProfessor ? "profesor" : "delegado";
  setFieldLabelText("labelParticipanteNombre", `Nombre del ${roleLabel}`);
  setFieldLabelText("labelParticipanteApellido", `Apellido del ${roleLabel}`);
  setFieldLabelText("labelParticipanteNumeroSocio", "Numero de socio propio o vinculado autorizado");
  setFieldLabelText("labelParticipanteTira", "Tira / equipo vinculado");
  setFieldLabelText("labelParticipanteWhatsapp", "WhatsApp");
  setParticipantTypeNotice(
    isProfessor
      ? "Esta opcion es solo para profesores vinculados al Baby All Boys."
      : "Esta opcion es solo para delegados vinculados al Baby All Boys.",
    "info"
  );
}

function validateMemberNumber() {
  const memberNumber = (byId("participanteNumeroSocio")?.value || "").trim();
  if (memberNumber) return true;
  setSubmissionStatus("error", "Para participar y poder reclamar premios, tenes que ingresar un numero de socio.");
  scrollNodeIntoView("participanteNumeroSocio");
  byId("participanteNumeroSocio")?.focus();
  return false;
}

function readParticipantForm() {
  const type = getParticipantType();
  const nombre = byId("participanteNombre")?.value.trim() || "";
  const apellido = byId("participanteApellido")?.value.trim() || "";
  const nombreHijo = byId("participanteHijo")?.value.trim() || "";
  const apellidoHijo = byId("participanteApellidoHijo")?.value.trim() || "";
  const numeroSocio = byId("participanteNumeroSocio")?.value.trim() || "";
  const categoria = byId("participanteCategoria")?.value || "";
  const tira = byId("participanteTira")?.value || "";
  const whatsapp = byId("participanteWhatsapp")?.value.trim() || "";
  const vinculoBaby = byId("participanteVinculo")?.value || "";

  if (type === PARTICIPANT_TYPES.FAMILIAR) {
    return {
      tipo_participante: type,
      nombre,
      apellido,
      nombre_hijo: nombreHijo,
      apellido_hijo: apellidoHijo,
      numero_socio: numeroSocio,
      categoria,
      tira,
      whatsapp,
      vinculo_baby: vinculoBaby,
      jugador_vinculado_nombre: nombreHijo,
      jugador_vinculado_apellido: apellidoHijo,
      categoria_vinculada: categoria,
      tira_vinculada: tira,
      access_code_validated: isValidAccessCode() ? "SI" : ""
    };
  }

  if (type === PARTICIPANT_TYPES.PROFESOR || type === PARTICIPANT_TYPES.DELEGADO) {
    return {
      tipo_participante: type,
      nombre,
      apellido,
      nombre_hijo: "",
      apellido_hijo: "",
      numero_socio: numeroSocio,
      categoria: "",
      tira,
      whatsapp,
      vinculo_baby: "",
      jugador_vinculado_nombre: "",
      jugador_vinculado_apellido: "",
      categoria_vinculada: "",
      tira_vinculada: tira,
      access_code_validated: isValidAccessCode() ? "SI" : ""
    };
  }

  return {
    tipo_participante: PARTICIPANT_TYPES.JUGADOR,
    nombre,
    apellido,
    nombre_hijo: nombreHijo,
    apellido_hijo: apellidoHijo,
    numero_socio: numeroSocio,
    categoria,
    tira,
    whatsapp,
    vinculo_baby: "",
    jugador_vinculado_nombre: nombreHijo,
    jugador_vinculado_apellido: apellidoHijo,
    categoria_vinculada: categoria,
    tira_vinculada: tira,
    access_code_validated: isValidAccessCode() ? "SI" : ""
  };
}

async function handleSubmission(event) {
  event.preventDefault();
  if (state.submission.sending) return;
  const editing = isEditMode();

  const participante = readParticipantForm();
  const requiresLinkedChild = participante.tipo_participante === PARTICIPANT_TYPES.JUGADOR || participante.tipo_participante === PARTICIPANT_TYPES.FAMILIAR;
  if (requiresLinkedChild && !participante.apellido_hijo) {
    byId("participanteApellidoHijo")?.focus();
    setSubmissionStatus("error", "Completa el apellido del chico/a.");
    return;
  }

  if (!validateMemberNumber()) {
    return;
  }

  const form = byId("prodeForm");
  if (!form?.reportValidity()) {
    setSubmissionStatus("error", "Revisa los datos obligatorios antes de confirmar.");
    return;
  }

  if (!validateAccessCode()) {
    return;
  }

  if (!validateTermsAcceptance()) {
    return;
  }

  if (isProdeClosed()) {
    setSubmissionStatus("warning", "El Prode cerro. Ya no se reciben pronosticos.");
    updateSubmissionButton();
    renderEndpointNotice();
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    setSubmissionStatus("warning", "El Prode todavia no esta habilitado para recibir inscripciones.");
    updateSubmissionButton();
    return;
  }

  if (isStageLocked()) {
    setSubmissionStatus("warning", "Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion.");
    updateSubmissionButton();
    renderEndpointNotice();
    return;
  }

  const { pronosticos, incompletos } = collectPredictionRows();
  if (incompletos.length) {
    setSubmissionStatus("error", "Revisa los pronosticos antes de confirmar tu Prode.");
    return;
  }
  if (!pronosticos.length) {
    const hasSavedPredictions = Object.keys(state.submission.savedPredictions || {}).length > 0;
    setSubmissionStatus(
      hasSavedPredictions ? "warning" : "error",
      hasSavedPredictions
        ? "No hay partidos disponibles para guardar. Los pronosticos ya guardados o cerrados no se pueden modificar."
        : "Elegi al menos un signo antes de confirmar tu Prode."
    );
    return;
  }

  const payload = editing
    ? buildUpdatePayload(state.submission.participantCode, state.submission.stageId, pronosticos)
    : buildCreatePayload(participante, pronosticos);

  state.submission.sending = true;
  updateSubmissionButton();
  setSubmissionStatus("info", isEditMode() ? "Estamos actualizando tu Prode..." : "Estamos enviando tu Prode...");

  try {
    const response = await sendSubmissionToSheets(payload);
    const savedPredictions = Array.isArray(response?.saved_predictions) ? response.saved_predictions : [];
    const blockedPredictions = Array.isArray(response?.blocked_predictions) ? response.blocked_predictions : [];
    const outcomeStatus = buildSubmissionOutcomeStatus(response, {
      mode: String(response?.mode || (editing ? "updated" : "created")).trim() || (editing ? "updated" : "created")
    });
    rememberSavedPredictions(savedPredictions);
    rememberSavedPredictions(blockedPredictions.filter(item => String(item?.code || "").trim() === "PREDICTION_ALREADY_LOCKED"));
    state.submission.submitted = false;
    state.submission.lastAction = response?.mode || (editing ? "updated" : "created");
    removeDraftStorage();
    window.clearTimeout(draftSaveTimer);
    setDraftNotice("", "");

    if (response?.participant_code) {
      writeParticipantCodeStorage(response.participant_code);
    }

    if (response?.mode === "created" && response?.participant_code) {
      setSubmissionMode("edit", {
        participantCode: response.participant_code,
        stageId: response?.stage_id || "",
        locked: false,
        entryMode: "create",
        successCode: response.participant_code
      });
      setSubmissionStatus(outcomeStatus.type, outcomeStatus.message, { html: outcomeStatus.html });
      scrollNodeIntoView("participantCodeSuccess");
    } else if (response?.mode === "created" && !response?.participant_code) {
      setSubmissionMode("create", {
        participantCode: "",
        stageId: response?.stage_id || "",
        locked: false,
        entryMode: "create",
        successCode: ""
      });
      setSubmissionStatus("warning", "El Prode se envio, pero no recibimos el codigo. Avisa a la organizacion.");
    } else if (response?.mode === "updated") {
      setSubmissionMode("edit", {
        participantCode: state.submission.participantCode || response?.participant_code || "",
        stageId: response?.stage_id || state.submission.stageId || "",
        locked: false,
        entryMode: state.submission.entryMode,
        successCode: ""
      });
      setSubmissionStatus(outcomeStatus.type, outcomeStatus.message, { html: outcomeStatus.html });
      scrollNodeIntoView("currentCodeBanner");
    } else {
      setSubmissionStatus("success", "Listo, tu Prode fue enviado.");
    }
  } catch (error) {
    const code = String(error?.code || "").trim();
    const message = String(error?.message || "").trim();

    if (code === "DUPLICATE_WITHOUT_CODE") {
      state.submission.entryMode = "code";
      renderParticipantCodeUI();
      setSubmissionStatus(
        "error",
        'Ya existe un Prode para este jugador/a. Ingresá tu código para verlo o editarlo. <button type="button" class="inline-status-action" data-show-code-entry>Ingresar código</button>',
        { html: true }
      );
      scrollNodeIntoView("estadoEnvio");
    } else if (code === "CODE_NOT_FOUND") {
      setSubmissionStatus("error", "No encontramos un Prode asociado a ese codigo.");
    } else if (code === "STAGE_CLOSED") {
      state.submission.locked = true;
      renderParticipantCodeUI();
      setSubmissionStatus("warning", "Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion.");
    } else if (code === "STAGE_NOT_OPEN") {
      setSubmissionStatus("warning", "Ese partido pertenece a una etapa que todavia no esta habilitada.");
    } else if (code === "KNOCKOUT_MATCH_NOT_READY") {
      setSubmissionStatus("warning", "Ese cruce todavia no tiene definidos sus dos equipos.");
    } else if (code === "INVALID_KNOCKOUT_RESULT") {
      setSubmissionStatus("warning", "En eliminacion directa solo podes elegir que equipo clasifica.");
    } else if (code === "MATCH_CLOSED") {
      setSubmissionStatus("warning", "Ese partido ya estaba cerrado y no se guardo el pronostico.");
    } else if (code === "PREDICTION_ALREADY_LOCKED") {
      setSubmissionStatus("warning", "Ese partido ya habia sido guardado previamente y no se modifico.");
    } else if (code === "MATCH_TIME_MISSING") {
      setSubmissionStatus("warning", "Ese partido no se guardo porque todavia no tiene horario confirmado.");
    } else {
      setSubmissionStatus("error", message || "No pudimos enviar tu Prode. Proba de nuevo.");
    }
  } finally {
    state.submission.sending = false;
    updateSubmissionSummary();
    updatePredictionCardStates();
    updateSubmissionButton();
    renderEndpointNotice();
  }
}

init();
