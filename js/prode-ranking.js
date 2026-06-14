const PRODE_RANKING_ENDPOINT = "https://script.google.com/macros/s/AKfycbz1Vu2DhG0X8ZvgnSlL86i-j_ODhXTuod4cujysuaNyNHCb7pC4K1TGoETDQJECXMnS/exec";

const rankingState = {
  categoria: "",
  data: {
    loading: false,
    loaded: false,
    error: "",
    generatedAt: "",
    totalParticipantes: 0,
    totalResultadosFinales: 0,
    top5: [],
    rankingGeneral: [],
    rankingPorCategoria: {}
  }
};

function byId(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isLocalPreviewHost() {
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || "");
}

function shouldUseLiveRanking() {
  return new URLSearchParams(window.location.search).get("liveRanking") === "1" || !isLocalPreviewHost();
}

async function postRankingAction(payload) {
  const response = await fetch(PRODE_RANKING_ENDPOINT, {
    method: "POST",
    cache: "no-store",
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
    throw new Error(parsed.error || "No pudimos cargar el ranking.");
  }

  return parsed || {};
}

async function fetchRankingData() {
  if (!shouldUseLiveRanking()) {
    rankingState.data = {
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
    return rankingState.data;
  }

  rankingState.data.loading = true;
  const response = await postRankingAction({ action: "get_public_ranking" });
  const rankingGeneral = Array.isArray(response?.ranking_general) ? response.ranking_general : [];
  const top5 = Array.isArray(response?.top5) && response.top5.length ? response.top5 : rankingGeneral.slice(0, 5);
  rankingState.data = {
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
  if (!rankingState.categoria) {
    rankingState.categoria = Object.keys(rankingState.data.rankingPorCategoria).sort((a, b) => a.localeCompare(b, "es"))[0] || "";
  }
  return rankingState.data;
}

function formatTimestamp(value) {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildRowCard(row) {
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

function buildEmpty(message) {
  return `<div class="empty public-ranking-empty">${esc(message)}</div>`;
}

function getBestCategory() {
  const entries = Object.entries(rankingState.data.rankingPorCategoria || {});
  if (!entries.length) return "";
  return entries
    .map(([categoria, rows]) => ({
      categoria,
      total: (Array.isArray(rows) ? rows : []).reduce((acc, row) => acc + Number(row?.puntos || 0), 0)
    }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "es"))[0]?.categoria || "";
}

function renderHeroSummary() {
  byId("rankingHeroResults").textContent = String(rankingState.data.totalResultadosFinales || 0);
  byId("rankingHeroParticipants").textContent = String(rankingState.data.totalParticipantes || 0);
}

function renderNotice() {
  const title = byId("rankingNoticeTitle");
  const text = byId("rankingNoticeText");
  if (!title || !text) return;

  if (rankingState.data.error) {
    title.textContent = "No pudimos actualizar el ranking";
    text.textContent = rankingState.data.error;
    return;
  }

  if (!rankingState.data.totalResultadosFinales || !rankingState.data.rankingGeneral.length) {
    title.textContent = "Todavia no hay resultados computados.";
    text.textContent = "Apenas se carguen resultados reales desde el admin del Prode, esta tabla se actualiza automaticamente.";
    return;
  }

  title.textContent = "Top 5 parcial";
  text.textContent = "Ranking actualizado con resultados cargados. Sujeto a revision de resultados.";
}

function renderTop5() {
  const container = byId("rankingTop5List");
  if (!container) return;
  if (rankingState.data.error) {
    container.innerHTML = buildEmpty(rankingState.data.error);
    return;
  }
  if (!rankingState.data.totalResultadosFinales || !rankingState.data.top5.length) {
    container.innerHTML = buildEmpty("Todavia no hay resultados computados.");
    return;
  }
  container.innerHTML = rankingState.data.top5.map(buildRowCard).join("");
}

function renderGeneralList() {
  const container = byId("rankingGeneralList");
  if (!container) return;
  if (rankingState.data.error) {
    container.innerHTML = buildEmpty(rankingState.data.error);
    return;
  }

  const moreRows = rankingState.data.rankingGeneral.slice(5);
  if (!rankingState.data.totalResultadosFinales || !moreRows.length) {
    container.innerHTML = buildEmpty("Todavia no hay mas posiciones para mostrar.");
    return;
  }
  container.innerHTML = moreRows.map(buildRowCard).join("");
}

function renderCategoryChips() {
  const container = byId("rankingCategoryChips");
  if (!container) return;
  const categories = Object.keys(rankingState.data.rankingPorCategoria || {}).sort((a, b) => a.localeCompare(b, "es"));
  if (!categories.length) {
    container.innerHTML = "";
    return;
  }
  if (!rankingState.categoria || !categories.includes(rankingState.categoria)) {
    rankingState.categoria = categories[0];
  }
  container.innerHTML = categories.map(cat => `
    <button
      type="button"
      class="ranking-chip ${cat === rankingState.categoria ? "activo" : ""}"
      data-ranking-category="${esc(cat)}"
    >
      ${esc(cat)}
    </button>
  `).join("");
}

function renderCategoryTable() {
  const title = byId("rankingCategoryTitle");
  const caption = byId("rankingCategoryCaption");
  const container = byId("rankingCategoryTable");
  if (!title || !caption || !container) return;

  const rows = Array.isArray(rankingState.data.rankingPorCategoria?.[rankingState.categoria])
    ? rankingState.data.rankingPorCategoria[rankingState.categoria]
    : [];

  title.textContent = rankingState.categoria ? `Categoria ${rankingState.categoria}` : "Ranking por categoria";

  if (rankingState.data.error) {
    caption.textContent = "No pudimos actualizar esta categoria.";
    container.innerHTML = buildEmpty(rankingState.data.error);
    return;
  }

  if (!rankingState.data.totalResultadosFinales || !rows.length) {
    caption.textContent = "Todavia no hay resultados computados para esta categoria.";
    container.innerHTML = buildEmpty("Todavia no hay posiciones cargadas para esta categoria.");
    return;
  }

  caption.textContent = `${rows.length} participantes visibles en esta categoria.`;
  container.innerHTML = rows.map(row => `
    <article class="ranking-table-row">
      <span class="ranking-table-col position">${esc(row.posicion)}</span>
      <span class="ranking-table-col family">
        <strong>${esc(row.display_name)}</strong>
        <small>${esc(row.tira_display)} · ${esc(row.aciertos)} aciertos · ${esc(row.computados)} computados</small>
      </span>
      <span class="ranking-table-col points">${esc(row.puntos)} pts</span>
    </article>
  `).join("");
}

function renderMoves() {
  const container = byId("rankingMovesGrid");
  if (!container) return;
  if (rankingState.data.error) {
    container.innerHTML = buildEmpty(rankingState.data.error);
    return;
  }

  const leader = rankingState.data.rankingGeneral[0];
  const bestCategory = getBestCategory();
  const generatedAt = formatTimestamp(rankingState.data.generatedAt);

  const items = [
    {
      title: "Puntero actual",
      value: leader ? `${leader.display_name} · ${leader.puntos} pts` : "-",
      text: leader ? `${leader.aciertos} aciertos sobre ${leader.computados} partidos computados.` : "Todavia no hay resultados computados."
    },
    {
      title: "Categoria caliente",
      value: bestCategory || "-",
      text: bestCategory ? "Es la categoria con mejor volumen de puntos visibles." : "Se completa cuando haya resultados cargados."
    },
    {
      title: "Ultima actualizacion",
      value: generatedAt || "Pendiente",
      text: generatedAt ? "La tabla se recalculo al consultar esta pagina." : "Se actualiza automaticamente cuando haya resultados reales."
    }
  ];

  container.innerHTML = items.map(item => `
    <article class="move-card">
      <span>${esc(item.title)}</span>
      <strong>${esc(item.value)}</strong>
      <p>${esc(item.text)}</p>
    </article>
  `).join("");
}

function bindEvents() {
  byId("rankingCategoryChips")?.addEventListener("click", event => {
    const button = event.target.closest("[data-ranking-category]");
    if (!button) return;
    rankingState.categoria = button.dataset.rankingCategory || rankingState.categoria;
    renderCategoryChips();
    renderCategoryTable();
  });
}

async function initRankingPage() {
  const status = byId("estadoRanking");
  try {
    await fetchRankingData();
    renderHeroSummary();
    renderNotice();
    renderTop5();
    renderGeneralList();
    renderCategoryChips();
    renderCategoryTable();
    renderMoves();
    bindEvents();
    if (status) {
      status.hidden = true;
      status.className = "status-card ok";
      status.textContent = "";
    }
  } catch (error) {
    console.warn("[Prode ranking]", error);
    rankingState.data.error = String(error?.message || "No pudimos cargar el ranking.").trim();
    renderHeroSummary();
    renderNotice();
    renderTop5();
    renderGeneralList();
    renderCategoryChips();
    renderCategoryTable();
    renderMoves();
    bindEvents();
    if (status) {
      status.hidden = false;
      status.className = "status-card error";
      status.textContent = rankingState.data.error;
    }
  }
}

document.addEventListener("DOMContentLoaded", initRankingPage);
