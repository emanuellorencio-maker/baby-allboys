const RANKING_MVP_DATA = [
  { id: "r1", adulto: "Martin Aguirre", chico: "Tomi", categoria: "2016", tira: "All Boys A", puntos: 18, delta: 2, novedad: "Subio al primer puesto con tres exactos." },
  { id: "r2", adulto: "Carla Benitez", chico: "Valen", categoria: "2015", tira: "All Boys A", puntos: 16, delta: 1, novedad: "Se mantiene en podio y no afloja." },
  { id: "r3", adulto: "Diego Pereyra", chico: "Lucho", categoria: "2014", tira: "All Boys B", puntos: 15, delta: 3, novedad: "Metio el salto mas fuerte de la jornada." },
  { id: "r4", adulto: "Sofia Mendez", chico: "Nico", categoria: "2013", tira: "All Boys A", puntos: 14, delta: -1, novedad: "Perdio una posicion pero sigue prendida." },
  { id: "r5", adulto: "Juan Veron", chico: "Emma", categoria: "2017", tira: "All Boys B", puntos: 13, delta: 1, novedad: "Sumo fuerte en partidos cerrados." },
  { id: "r6", adulto: "Luciana Torres", chico: "Milo", categoria: "2018/19", tira: "All Boys A", puntos: 12, delta: 4, novedad: "Se metio en zona caliente del Top 10." },
  { id: "r7", adulto: "Pablo Ruiz", chico: "Ciro", categoria: "2016", tira: "All Boys A", puntos: 11, delta: 0, novedad: "Jornada pareja, sin cambios." },
  { id: "r8", adulto: "Florencia Sosa", chico: "Benja", categoria: "2015", tira: "All Boys B", puntos: 10, delta: -2, novedad: "Quedo a tiro de volver a podio." },
  { id: "r9", adulto: "Gaston Romero", chico: "Thiago", categoria: "2014", tira: "All Boys A", puntos: 9, delta: 2, novedad: "Se prendio con resultados exactos." },
  { id: "r10", adulto: "Paula Vega", chico: "Santi", categoria: "2013", tira: "All Boys B", puntos: 8, delta: 1, novedad: "Sigue sumando y acercandose arriba." },
  { id: "r11", adulto: "Nadia Molina", chico: "Joaco", categoria: "2017", tira: "All Boys A", puntos: 7, delta: -1, novedad: "Todavia en carrera para meterse." },
  { id: "r12", adulto: "Leandro Castro", chico: "Lauti", categoria: "2018/19", tira: "All Boys B", puntos: 6, delta: 3, novedad: "Aparecio con una fecha muy buena." }
];

const RANKING_MVP_CATEGORIES = ["2013", "2014", "2015", "2016", "2017", "2018/19"];

const rankingState = {
  categoria: "2016"
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

function sortRanking(rows) {
  return [...rows].sort((a, b) =>
    b.puntos - a.puntos ||
    b.delta - a.delta ||
    a.adulto.localeCompare(b.adulto, "es")
  ).map((row, index) => ({ ...row, puesto: index + 1 }));
}

function getRankingData() {
  return sortRanking(RANKING_MVP_DATA);
}

function getCategoryRows(categoria) {
  return sortRanking(RANKING_MVP_DATA.filter(item => item.categoria === categoria));
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

function renderHeroSummary(rows) {
  const lider = rows[0];
  const hottest = [...RANKING_MVP_CATEGORIES]
    .map(cat => ({
      categoria: cat,
      total: rows.filter(item => item.categoria === cat).reduce((acc, item) => acc + item.puntos, 0)
    }))
    .sort((a, b) => b.total - a.total)[0];

  byId("rankingHeroLeader").textContent = lider ? `${lider.adulto} · ${lider.chico}` : "-";
  byId("rankingHeroPoints").textContent = lider ? `${lider.puntos} pts` : "0 pts";
  byId("rankingHeroCategory").textContent = hottest ? hottest.categoria : "-";
}

function renderPodium(rows) {
  const podium = rows.slice(0, 3);
  const medals = [
    { className: "first", icon: "1°", label: "Puntero" },
    { className: "second", icon: "2°", label: "Escolta" },
    { className: "third", icon: "3°", label: "Podio" }
  ];

  byId("rankingPodio").innerHTML = podium.map((row, index) => {
    const medal = medals[index];
    return `
      <article class="podium-card ${medal.className}">
        <span class="podium-medal">${medal.icon}</span>
        <strong>${esc(row.adulto)}</strong>
        <p>${esc(row.chico)} · ${esc(row.categoria)} · ${esc(row.tira)}</p>
        <div class="podium-points">${esc(row.puntos)} pts</div>
        <small>${esc(medal.label)} · Movimiento ${esc(formatDelta(row.delta))}</small>
      </article>
    `;
  }).join("");
}

function renderTop10(rows) {
  byId("rankingGeneralList").innerHTML = rows.slice(0, 10).map(row => `
    <article class="ranking-row-card">
      <div class="ranking-row-position">${esc(row.puesto)}</div>
      <div class="ranking-row-main">
        <strong>${esc(row.adulto)}</strong>
        <p>${esc(row.chico)} · ${esc(row.categoria)} · ${esc(row.tira)}</p>
      </div>
      <div class="ranking-row-side">
        <strong>${esc(row.puntos)} pts</strong>
        <span>Movimiento ${esc(formatDelta(row.delta))}</span>
      </div>
    </article>
  `).join("");
}

function renderCategoryChips() {
  byId("rankingCategoryChips").innerHTML = RANKING_MVP_CATEGORIES.map(cat => `
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
  const rows = getCategoryRows(rankingState.categoria);
  byId("rankingCategoryTitle").textContent = `Categoria ${rankingState.categoria}`;
  byId("rankingCategoryCaption").textContent = rows.length
    ? `${rows.length} participantes visibles en esta categoria.`
    : "Todavia no hay participantes cargados en esta categoria.";

  byId("rankingCategoryTable").innerHTML = rows.map(row => `
    <article class="ranking-table-row">
      <span class="ranking-table-col position">${esc(row.puesto)}</span>
      <span class="ranking-table-col family">
        <strong>${esc(row.adulto)}</strong>
        <small>${esc(row.chico)} · ${esc(row.tira)}</small>
      </span>
      <span class="ranking-table-col points">${esc(row.puntos)} pts</span>
    </article>
  `).join("") || '<div class="empty">Todavia no hay posiciones cargadas para esta categoria.</div>';
}

function renderMoves(rows) {
  const biggestJump = [...rows].sort((a, b) => b.delta - a.delta)[0];
  const leader = rows[0];
  const hottestCategory = [...RANKING_MVP_CATEGORIES]
    .map(cat => ({
      categoria: cat,
      promedio: getCategoryRows(cat).reduce((acc, item) => acc + item.puntos, 0) / Math.max(getCategoryRows(cat).length, 1)
    }))
    .sort((a, b) => b.promedio - a.promedio)[0];

  const items = [
    {
      title: "Subida del dia",
      value: biggestJump ? `${biggestJump.adulto} ${formatDelta(biggestJump.delta)}` : "-",
      text: biggestJump ? biggestJump.novedad : "Sin movimientos destacados."
    },
    {
      title: "Lider actual",
      value: leader ? `${leader.adulto} · ${leader.puntos} pts` : "-",
      text: leader ? leader.novedad : "Todavia no hay lideres visibles."
    },
    {
      title: "Categoria caliente",
      value: hottestCategory ? hottestCategory.categoria : "-",
      text: hottestCategory ? `Es la categoria con mejor promedio visible hoy.` : "Todavia no hay datos para comparar."
    }
  ];

  byId("rankingMovesGrid").innerHTML = items.map(item => `
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

function initRankingPage() {
  const rows = getRankingData();
  renderHeroSummary(rows);
  renderPodium(rows);
  renderTop10(rows);
  renderCategoryChips();
  renderCategoryTable();
  renderMoves(rows);
  bindEvents();

  const status = byId("estadoRanking");
  if (status) {
    status.className = "status-card ok";
    status.textContent = "Ranking publico listo.";
  }
}

document.addEventListener("DOMContentLoaded", initRankingPage);
