const CATEGORIAS = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"];
const TIRAS = ["All Boys A", "All Boys B", "Los Albos", "All Boys"];
const INSTANCIAS = ["Grupos", "32avos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];
const DOMINIOS_NOTICIAS = new Set(["fifa.com", "www.fifa.com", "inside.fifa.com"]);
const PRODE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbz1Vu2DhG0X8ZvgnSlL86i-j_ODhXTuod4cujysuaNyNHCb7pC4K1TGoETDQJECXMnS/exec";
const PRODE_SUBMISSION_VERSION = "fase-2-google-sheets";
const COUNTRY_CODES = {
  Algeria: "DZ",
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Cameroon: "CM",
  Canada: "CA",
  "Cape Verde": "CV",
  Chile: "CL",
  Colombia: "CO",
  "Costa Rica": "CR",
  Croatia: "HR",
  Curacao: "CW",
  Denmark: "DK",
  Ecuador: "EC",
  Egypt: "EG",
  England: "GB",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Haiti: "HT",
  Honduras: "HN",
  Iran: "IR",
  "Ivory Coast": "CI",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Norway: "NO",
  Panama: "PA",
  Paraguay: "PY",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Scotland: "GB",
  Senegal: "SN",
  Serbia: "RS",
  Slovenia: "SI",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Switzerland: "CH",
  Tunisia: "TN",
  Turkey: "TR",
  "United States": "US",
  Uruguay: "UY",
  Uzbekistan: "UZ"
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

const $ = selector => document.querySelector(selector);
const byId = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, match => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[match]));
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function parseIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  if (!Number.isFinite(gl) || !Number.isFinite(gv)) return null;
  if (gl > gv) return "L";
  if (gl < gv) return "V";
  return "E";
}

function getOutcome(gl, gv) {
  if (!Number.isFinite(gl) || !Number.isFinite(gv)) return null;
  if (gl > gv) return "L";
  if (gl < gv) return "V";
  return "E";
}

function calculatePoints(pronostico, partido) {
  if (!partido) return { puntos: 0, estado: "pendiente", exacto: 0, acierto: 0, playoff: 0 };
  const realOutcome = getMatchOutcome(partido);
  if (!realOutcome) return { puntos: 0, estado: "pendiente", exacto: 0, acierto: 0, playoff: 0 };

  const gl = pronostico?.goles_local;
  const gv = pronostico?.goles_visitante;
  if (!Number.isFinite(gl) || !Number.isFinite(gv)) return { puntos: 0, estado: "pendiente", exacto: 0, acierto: 0, playoff: 0 };

  const realLocal = partido.resultado_real.goles_local;
  const realVisit = partido.resultado_real.goles_visitante;
  const knockout = partido.instancia && partido.instancia !== "Grupos";

  if (gl === realLocal && gv === realVisit) {
    return { puntos: 5, estado: "exacto", exacto: 1, acierto: 1, playoff: knockout ? 5 : 0 };
  }

  if (getOutcome(gl, gv) === realOutcome) {
    const diffPred = gl - gv;
    const diffReal = realLocal - realVisit;
    if (diffPred === diffReal) {
      return { puntos: 4, estado: "diferencia", exacto: 0, acierto: 1, playoff: knockout ? 4 : 0 };
    }
    return { puntos: 3, estado: "signo", exacto: 0, acierto: 1, playoff: knockout ? 3 : 0 };
  }

  return { puntos: 0, estado: "error", exacto: 0, acierto: 0, playoff: 0 };
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
    b.exactos - a.exactos ||
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
  if (participante.exactos >= 2) badges.push(`Exactos x${participante.exactos}`);
  if (participante.diferencias >= 2) badges.push("Lee los partidos");
  if (bestBy("categoria", participante.categoria)?.id === participante.id) badges.push("Mejor de su categoria");
  return badges;
}

function getHeroPhrase(participante) {
  if (!participante) return "";
  if (participante.puesto === 1) return "Arranco arriba en la tabla familiar.";
  if (participante.puesto <= 3) return "Ya esta en zona de podio.";
  if (participante.exactos) return "Tiene ojo para los resultados cerrados.";
  return "Sigue prendido para cuando empiece el Mundial.";
}

function filterRanking() {
  const query = norm(state.busqueda);
  let rows = [...state.ranking];

  if (query) {
    rows = rows.filter(row => norm(`${row.nombre} ${row.apellido} ${row.nombre_hijo}`).includes(query));
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
  if (state.vista === "exactos") rows.sort((a, b) => b.exactos - a.exactos || b.puntos - a.puntos || a.puesto - b.puesto);
  if (state.vista === "aciertos") rows.sort((a, b) => b.aciertos - a.aciertos || b.puntos - a.puntos || a.puesto - b.puesto);
  if (state.vista === "familias") rows.sort((a, b) => a.categoria.localeCompare(b.categoria, "es") || a.puesto - b.puesto);

  return rows;
}

function selectTemplate(id, label, values, selected) {
  return `
    <label class="filter-label">
      <span>${label}</span>
      <select id="${id}">
        ${values.map(value => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${value ? esc(value) : "Todos"}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderSummary() {
  const lider = state.ranking[0];
  const abiertos = state.partidos.filter(partido => partido.estado === "abierto").length;
  const finalizados = state.partidos.filter(partido => partido.estado === "finalizado").length;
  const pronosticos = state.participantes.reduce((acc, participante) => acc + (participante.pronosticos || []).length, 0);
  const promedios = state.ranking.length ? (state.ranking.reduce((acc, item) => acc + item.puntos, 0) / state.ranking.length).toFixed(1) : "0.0";
  const mejorCategoria = CATEGORIAS
    .map(cat => ({ cat, total: state.ranking.filter(item => item.categoria === cat).reduce((acc, item) => acc + item.puntos, 0) }))
    .sort((a, b) => b.total - a.total)[0];

  byId("resumenProde").innerHTML = [
    ["Participantes", state.participantes.length],
    ["Partidos del prode", state.partidos.length],
    ["Abiertos", abiertos],
    ["Finalizados", finalizados],
    ["Pronosticos cargados", pronosticos],
    ["Lider actual", lider ? `${lider.nombre} ${lider.apellido}` : "A definir"],
    ["Categoria caliente", mejorCategoria?.cat || "-"],
    ["Promedio", promedios]
  ].map(([label, value]) => `<article class="summary-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
}

function getCountryCode(teamName) {
  return COUNTRY_CODES[teamName] || null;
}

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return code.toUpperCase().split("").map(letter => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}

function getFallbackLabel(teamName) {
  if (/playoff/i.test(teamName)) return "PO";
  const parts = teamName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map(part => part[0] || "").join("").slice(0, 2).toUpperCase();
}

function renderTeamBadge(teamName) {
  const code = getCountryCode(teamName);
  if (code) {
    return `<span class="team-badge"><span class="team-flag" aria-hidden="true">${getFlagEmoji(code)}</span></span>`;
  }
  return `<span class="team-badge placeholder"><span class="team-fallback">${esc(getFallbackLabel(teamName))}</span></span>`;
}

function renderTeamNote(teamName) {
  if (/playoff/i.test(teamName)) return "Clasificacion pendiente";
  if (/pendiente/i.test(teamName)) return "Cruce a definir";
  return "Seleccion confirmada";
}

function renderMatchRow(teamName, goals) {
  const pending = !Number.isFinite(goals);
  return `
    <div class="team-row">
      <div class="team-chip">
        ${renderTeamBadge(teamName)}
        <div class="team-copy">
          <span class="team-name">${esc(teamName)}</span>
          <span class="team-note">${esc(renderTeamNote(teamName))}</span>
        </div>
      </div>
      <div class="match-score ${pending ? "pending" : ""}">${pending ? "-" : esc(goals)}</div>
    </div>
  `;
}

function renderMatchesOverview() {
  const openMatches = state.partidos.filter(partido => partido.estado === "abierto");
  const nextMatch = [...openMatches].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))[0];
  const sedes = new Set(state.partidos.map(partido => partido.sede).filter(Boolean)).size;
  const instancias = new Set(state.partidos.map(partido => partido.instancia).filter(Boolean)).size;
  byId("resumenPartidos").innerHTML = [
    ["Siguiente fecha", nextMatch ? formatDate(nextMatch.fecha) : "A confirmar"],
    ["Primer cruce", nextMatch ? `${nextMatch.equipo_local} vs ${nextMatch.equipo_visitante}` : "Sin partidos"],
    ["Sedes", sedes],
    ["Instancias", instancias]
  ].map(([label, value]) => `<article class="strip-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
}

function renderMatches() {
  const container = byId("listaPartidos");
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
          <span class="match-state ${stateClass}">${esc(finalizado ? "Resultado cargado" : "Prode abierto")}</span>
        </div>
        <div class="match-teams">
          ${renderMatchRow(partido.equipo_local, realLocal)}
          ${renderMatchRow(partido.equipo_visitante, realVisit)}
        </div>
        <div class="match-footer">
          <span>${esc(formatDateLong(partido.fecha))}</span>
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
    return `
      <article class="prediction-entry-card ${editable ? "editable" : "locked"}">
        <div class="prediction-entry-head">
          <span>${esc([partido.instancia, partido.grupo].filter(Boolean).join(" - ") || "Mundial 2026")}</span>
          <strong>${esc(getPredictionStatusLabel(partido))}</strong>
        </div>
        <div class="prediction-entry-match">
          <div class="prediction-entry-team">
            ${renderTeamBadge(partido.equipo_local)}
            <div class="prediction-entry-copy">
              <span class="team-name">${esc(partido.equipo_local)}</span>
              <span class="team-note">${esc(renderTeamNote(partido.equipo_local))}</span>
            </div>
          </div>
          <div class="prediction-entry-inputs">
            <label class="score-input-wrap">
              <span class="sr-only">Goles ${esc(partido.equipo_local)}</span>
              <input id="pred-local-${esc(partido.id)}" class="score-input" type="number" min="0" max="30" step="1" inputmode="numeric" data-partido-id="${esc(partido.id)}" data-side="local" ${disabledAttr} />
            </label>
            <span class="score-separator">-</span>
            <label class="score-input-wrap">
              <span class="sr-only">Goles ${esc(partido.equipo_visitante)}</span>
              <input id="pred-visitante-${esc(partido.id)}" class="score-input" type="number" min="0" max="30" step="1" inputmode="numeric" data-partido-id="${esc(partido.id)}" data-side="visitante" ${disabledAttr} />
            </label>
          </div>
          <div class="prediction-entry-team visitor">
            ${renderTeamBadge(partido.equipo_visitante)}
            <div class="prediction-entry-copy">
              <span class="team-name">${esc(partido.equipo_visitante)}</span>
              <span class="team-note">${esc(renderTeamNote(partido.equipo_visitante))}</span>
            </div>
          </div>
        </div>
        <div class="prediction-entry-meta">
          <span>${esc(formatDateLong(partido.fecha))}</span>
          <span>${esc(partido.sede || "Sede a confirmar")}</span>
        </div>
      </article>
    `;
  }).join("");
}

function getPredictionInputs(partidoId) {
  return {
    local: byId(`pred-local-${partidoId}`),
    visitante: byId(`pred-visitante-${partidoId}`)
  };
}

function collectPredictionRows() {
  const pronosticos = [];
  const incompletos = [];

  state.partidos.forEach(partido => {
    const { local, visitante } = getPredictionInputs(partido.id);
    if (!local || !visitante) return;

    const rawLocal = local.value.trim();
    const rawVisitante = visitante.value.trim();
    if (!rawLocal && !rawVisitante) return;

    if (!rawLocal || !rawVisitante) {
      incompletos.push(partido.id);
      return;
    }

    const golesLocal = Number(rawLocal);
    const golesVisitante = Number(rawVisitante);
    if (!Number.isInteger(golesLocal) || golesLocal < 0 || !Number.isInteger(golesVisitante) || golesVisitante < 0) {
      incompletos.push(partido.id);
      return;
    }

    pronosticos.push({
      partido_id: partido.id,
      equipo_local: partido.equipo_local,
      equipo_visitante: partido.equipo_visitante,
      goles_local: golesLocal,
      goles_visitante: golesVisitante
    });
  });

  return { pronosticos, incompletos };
}

function readParticipantForm() {
  return {
    nombre: byId("participanteNombre")?.value.trim() || "",
    apellido: byId("participanteApellido")?.value.trim() || "",
    nombre_hijo: byId("participanteHijo")?.value.trim() || "",
    categoria: byId("participanteCategoria")?.value || "",
    tira: byId("participanteTira")?.value || "",
    whatsapp: byId("participanteWhatsapp")?.value.trim() || ""
  };
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
  const hijo = participante.nombre_hijo || "sin chico/a";

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
  const node = byId("endpointNotice");
  if (!node) return;
  if (isSheetsEndpointConfigured()) {
    node.className = "endpoint-alert ok";
    node.innerHTML = "<strong>Endpoint listo.</strong> La p&aacute;gina puede enviar el payload del Prode al Web App de Google Sheets.";
    return;
  }

  node.className = "endpoint-alert warning";
  node.innerHTML = "<strong>Falta configurar endpoint de Google Sheets.</strong> Pod&eacute;s revisar el formulario y cargar pron&oacute;sticos, pero el env&iacute;o queda bloqueado hasta completar <code>PRODE_SHEETS_ENDPOINT</code> en <code>js/prode-mundial.js</code>.";
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
  if (!response.ok) {
    throw new Error(raw || `HTTP ${response.status}`);
  }
  return raw;
}

async function handleSubmission(event) {
  event.preventDefault();
  if (state.submission.sending) return;

  const form = byId("prodeForm");
  if (!form?.reportValidity()) {
    setSubmissionStatus("error", "Revisa los campos obligatorios antes de confirmar.");
    return;
  }

  if (!isSheetsEndpointConfigured()) {
    setSubmissionStatus("warning", "Falta configurar el endpoint de Google Sheets para habilitar el envio.");
    updateSubmissionButton();
    return;
  }

  const { pronosticos, incompletos } = collectPredictionRows();
  if (incompletos.length) {
    setSubmissionStatus("error", "Hay partidos con un solo marcador cargado o con valores invalidos. Completalos o dejalos vacios.");
    return;
  }
  if (!pronosticos.length) {
    setSubmissionStatus("error", "Carga al menos un pronostico completo antes de confirmar tu Prode.");
    return;
  }

  const participante = readParticipantForm();
  const payload = buildSubmissionPayload(participante, pronosticos);

  state.submission.sending = true;
  updateSubmissionButton();
  setSubmissionStatus("info", "Enviando tu Prode a Google Sheets...");

  try {
    await sendSubmissionToSheets(payload);
    state.submission.submitted = true;
    setSubmissionStatus("success", `Tu Prode se envio con ${pronosticos.length} pronosticos completos.`);
  } catch (error) {
    setSubmissionStatus("error", `No se pudo enviar el Prode. ${error.message || "Revisa el Apps Script y el CORS."}`);
  } finally {
    state.submission.sending = false;
    updateSubmissionButton();
  }
}

function handleSubmissionInputChange() {
  if (state.submission.submitted) {
    state.submission.submitted = false;
    setSubmissionStatus("info", "Detectamos cambios en el formulario. Si queres, podes reenviar el Prode.");
  }
  updateSubmissionSummary();
  updateSubmissionButton();
}

function renderFilters() {
  const grupos = [...new Set(state.partidos.map(partido => partido.grupo).filter(Boolean))];
  const fechas = [...new Set(state.partidos.map(partido => partido.fecha).filter(Boolean))];
  const selecciones = [...new Set(state.partidos.flatMap(partido => [partido.equipo_local, partido.equipo_visitante]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

  byId("tabsRanking").innerHTML = [
    ["general", "General"],
    ["categorias", "Categorias"],
    ["tiras", "Tiras"],
    ["exactos", "Exactos"],
    ["aciertos", "Aciertos"],
    ["familias", "Familias"]
  ].map(([id, label]) => `<button class="tab-btn ${state.vista === id ? "activo" : ""}" data-tab="${id}">${label}</button>`).join("");

  byId("filtrosProde").innerHTML = `
    ${selectTemplate("categoria", "Categoria", ["", ...CATEGORIAS], state.categoria)}
    ${selectTemplate("tira", "Tira", ["", ...TIRAS], state.tira)}
    ${selectTemplate("grupo", "Grupo", ["", ...grupos], state.grupo)}
    ${selectTemplate("instancia", "Instancia", ["", ...INSTANCIAS], state.instancia)}
    ${selectTemplate("fecha", "Fecha", ["", ...fechas], state.fecha)}
    ${selectTemplate("seleccion", "Seleccion", ["", ...selecciones], state.seleccion)}
    <button type="button" class="clear-btn" id="limpiarFiltros">Limpiar</button>
  `;
}

function renderRanking() {
  const rows = filterRanking();
  const titles = {
    general: "Tabla general",
    categorias: "Ranking por categoria",
    tiras: "Ranking por tira",
    exactos: "Mas exactos",
    aciertos: "Mas aciertos de signo",
    familias: "Busqueda por familia"
  };
  byId("tituloRanking").textContent = titles[state.vista] || "Tabla general";

  if (!state.participantes.length) {
    byId("rankingLista").innerHTML = '<div class="empty">Todavia no hay participantes cargados.</div>';
    return;
  }
  if (!rows.length) {
    byId("rankingLista").innerHTML = '<div class="empty">No hay familias para esos filtros.</div>';
    return;
  }

  const finalizados = state.partidos.some(partido => partido.estado === "finalizado");
  byId("rankingLista").innerHTML = `${!finalizados ? '<div class="empty">El ranking va a cobrar vida cuando haya resultados oficiales cargados.</div>' : ""}${rows.map(row => `
    <button type="button" class="rank-card ${row.puesto === 1 ? "top1" : ""}" data-id="${esc(row.id)}">
      <span class="place">${row.puesto <= 3 ? `#${row.puesto}` : row.puesto}</span>
      <span class="who">
        <strong>${esc(row.apellido)}, ${esc(row.nombre)}</strong>
        <span>Hijo: ${esc(row.nombre_hijo)} - ${esc(row.categoria)} - ${esc(row.tira)}</span>
        <span class="stats-mini">Exactos ${row.exactos} - Aciertos ${row.aciertos} - Bonus diferencia ${row.diferencias} - Pendientes ${row.pendientes}</span>
      </span>
      <span class="points"><strong>${row.puntos}</strong><span>pts</span></span>
      <span class="badges">${getBadges(row).map(badge => `<span class="badge">${esc(badge)}</span>`).join("")}</span>
    </button>
  `).join("")}`;
}

function renderShareCard() {
  const participante = filterRanking()[0] || state.ranking[0];
  byId("cardViral").innerHTML = participante ? `
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
    <div class="viral-meta">${esc(participante.categoria)} - ${esc(participante.tira)} - Hijo: ${esc(participante.nombre_hijo)}</div>
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

  const real = getMatchOutcome(partido) ? `${partido.resultado_real.goles_local}-${partido.resultado_real.goles_visitante}` : "Pendiente";
  const statusLabels = {
    exacto: "Exacto",
    diferencia: "Diferencia correcta",
    signo: "Gano el signo",
    error: "Error",
    pendiente: "Pendiente"
  };

  return `
    <article class="prediction">
      <div class="prediction-top">
        <span>${esc(partido.equipo_local)} vs ${esc(partido.equipo_visitante)}</span>
        <span class="state-${item.estado}">${esc(statusLabels[item.estado] || "Pendiente")}</span>
      </div>
      <div class="prediction-meta">${esc(formatDate(partido.fecha))} - ${esc(partido.grupo || partido.instancia)} - Pronostico ${esc(pronostico.goles_local ?? "-")}-${esc(pronostico.goles_visitante ?? "-")} - Real ${esc(real)} - ${esc(item.puntos)} pts</div>
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
      <p>Hijo: ${esc(participante.nombre_hijo)} - ${esc(participante.categoria)} - ${esc(participante.tira)}</p>
    </div>
    <div class="detail-grid">
      ${detailTemplate("Puesto general", `#${participante.puesto}`)}
      ${detailTemplate("Puesto categoria", `#${categoryRank}`)}
      ${detailTemplate("Puesto tira", `#${teamRank}`)}
      ${detailTemplate("Puntos", participante.puntos)}
      ${detailTemplate("Exactos", participante.exactos)}
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

  byId("btnCompartirLider")?.addEventListener("click", () => shareStanding(state.ranking[0]?.id));
  byId("prodeForm")?.addEventListener("submit", handleSubmission);
  byId("prodeForm")?.addEventListener("input", handleSubmissionInputChange);
  byId("prodeForm")?.addEventListener("change", handleSubmissionInputChange);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      byId("modalParticipante")?.classList.add("oculto");
    }
  });
}

function bindDynamicFilters() {
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
    renderAll();
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
