(function () {
  const REPORT_TYPES = ["Resultado mal cargado", "Fixture incorrecto", "Tabla incorrecta", "Horario/dirección incorrecta", "Otro"];
  const TRACK_KEY = "babyAllBoysDeviceId";
  const DAY_KEY = "babyAllBoysAppOpenDay";
  const THROTTLE_PREFIX = "babyAllBoysTrack:";

  function safe(fn) {
    try { return fn(); } catch (error) { return null; }
  }

  function getDeviceId() {
    let id = localStorage.getItem(TRACK_KEY);
    if (!id) {
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(TRACK_KEY, id);
    }
    return id;
  }

  function modo() {
    return (matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) ? "standalone" : "browser";
  }

  function currentState() {
    return {
      zona: safe(() => zonaActual) || "",
      vista: safe(() => vistaActual) || "",
      fecha: safe(() => fechaResultadoActual) || "",
      modo: modo(),
    };
  }

  function track(event, opts = {}) {
    const state = currentState();
    const key = `${THROTTLE_PREFIX}${event}:${opts.once || state.zona || "global"}:${state.vista || "home"}`;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(key) || 0);
    if (opts.throttleMs && now - last < opts.throttleMs) return;
    sessionStorage.setItem(key, String(now));
    fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, zona: state.zona, vista: state.vista, modo: state.modo, device_id: getDeviceId(), meta: opts.meta || {} }),
    }).catch(() => {});
  }

  function trackDailyOpen() {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(DAY_KEY) === today) return;
    localStorage.setItem(DAY_KEY, today);
    track("app_open", { once: today });
  }

  function injectQuickActions() {
    const hero = document.querySelector(".hero");
    if (!hero || document.querySelector(".quick-actions")) return;
    const wrap = document.createElement("div");
    wrap.className = "quick-actions";
    wrap.innerHTML = [
      ["Fixture", "Próxima fecha", "fixture"],
      ["Resultados", "Última fecha", "resultados"],
      ["Tablas", "Posiciones", "tablas"],
      ["Reglamento", "FEFI", "reglamento"],
      ["Reportar error", "Avisanos", "reporte"],
    ].map(([title, sub, action]) => `<a class="quick-action" href="${action === "reglamento" ? "reglamento.html" : "#contenedor-principal"}" data-quick="${action}"><span>${title}<small>${sub}</small></span><span>›</span></a>`).join("");
    hero.appendChild(wrap);
    wrap.querySelectorAll("[data-quick]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const action = link.dataset.quick;
        if (action === "reporte") {
          event.preventDefault();
          openReportModal();
        } else if (["fixture", "resultados", "tablas"].includes(action)) {
          event.preventDefault();
          window.mostrarVista && window.mostrarVista(action);
          document.getElementById("contenedor-principal")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function injectReportButtons() {
    document.querySelectorAll("#vista-fixture,#vista-resultados,#vista-tablas").forEach((panel) => {
      if (panel.querySelector(".vista-tools")) return;
      const tools = document.createElement("div");
      tools.className = "vista-tools";
      tools.innerHTML = '<button class="report-inline" type="button">Reportar error</button>';
      panel.insertBefore(tools, panel.children[1] || null);
      tools.querySelector("button").addEventListener("click", openReportModal);
    });
  }

  function injectFooter() {
    const footer = document.querySelector(".footer-mini");
    if (!footer || document.querySelector(".footer-links")) return;
    const links = document.createElement("div");
    links.className = "footer-links";
    links.innerHTML = '<a href="reglamento.html">Reglamento FEFI</a><button type="button" data-footer-report>Reportar error</button><a href="https://instagram.com/baby_allboys" target="_blank" rel="noopener noreferrer">Instagram</a><button class="push-inline" type="button" id="push-enable" hidden>Activar notificaciones</button>';
    footer.parentNode.insertBefore(links, footer);
    links.querySelector("[data-footer-report]").addEventListener("click", openReportModal);
  }

  function ensureReportModal() {
    if (document.getElementById("report-modal")) return;
    const modal = document.createElement("div");
    modal.className = "report-modal";
    modal.id = "report-modal";
    modal.innerHTML = `<div class="report-dialog"><h2>Reportar error</h2><form class="report-form" id="report-form"><label>Tipo de error <select id="report-type">${REPORT_TYPES.map((t) => `<option>${t}</option>`).join("")}</select></label><label>Comentario <textarea id="report-comment" maxlength="500" required placeholder="Contanos qué dato está mal."></textarea></label><label>Contacto opcional <input id="report-contact" maxlength="120" placeholder="Nombre o WhatsApp"></label><div class="report-actions"><button class="report-cancel" type="button" id="report-cancel">Cancelar</button><button class="report-submit" type="submit">Enviar</button></div><div class="report-status" id="report-status"></div></form></div>`;
    document.body.appendChild(modal);
    document.getElementById("report-cancel").addEventListener("click", closeReportModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeReportModal(); });
    document.getElementById("report-form").addEventListener("submit", submitReport);
  }

  function openReportModal() {
    ensureReportModal();
    const status = document.getElementById("report-status");
    if (status) status.textContent = "";
    document.getElementById("report-modal").classList.add("abierto");
    document.getElementById("report-comment").focus();
  }

  function closeReportModal() {
    document.getElementById("report-modal")?.classList.remove("abierto");
  }

  async function submitReport(event) {
    event.preventDefault();
    const status = document.getElementById("report-status");
    const comentario = document.getElementById("report-comment").value.trim();
    if (comentario.length < 5) { status.textContent = "El comentario debe tener al menos 5 caracteres."; return; }
    if (comentario.length > 500) { status.textContent = "El comentario no puede superar 500 caracteres."; return; }
    const state = currentState();
    status.textContent = "Enviando...";
    try {
      const res = await fetch("/api/reportar-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zona: state.zona,
          vista: state.vista,
          fecha: state.fecha,
          categoria: "",
          tipo: document.getElementById("report-type").value,
          comentario,
          contacto: document.getElementById("report-contact").value.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al enviar");
      status.textContent = "Reporte enviado correctamente";
      document.getElementById("report-form").reset();
      setTimeout(closeReportModal, 900);
    } catch (error) {
      status.textContent = error.message || "Error al enviar";
    }
  }

  function numeric(value) {
    return /^\d+$/.test(String(value || "").trim()) ? Number(value) : null;
  }

  function buildSummary(partidos) {
    if (!Array.isArray(partidos)) return null;
    const p = partidos.find((item) => safe(() => esPropio(item.local)) || safe(() => esPropio(item.visitante)));
    if (!p) return null;
    const ownLocal = safe(() => esPropio(p.local));
    const allboys = ownLocal ? p.local : p.visitante;
    const rival = ownLocal ? p.visitante : p.local;
    const ptsAll = Number(ownLocal ? p.pts_local : p.pts_visitante);
    const ptsRival = Number(ownLocal ? p.pts_visitante : p.pts_local);
    if (!Number.isFinite(ptsAll) || !Number.isFinite(ptsRival)) return null;
    const stats = { g: 0, e: 0, p: 0, gf: 0, gc: 0, numeric: 0 };
    let best = null;
    Object.entries(p.resultados || {}).forEach(([cat, val]) => {
      const l = numeric(val && val.local), v = numeric(val && val.visitante);
      if (l === null || v === null) return;
      const gf = ownLocal ? l : v, gc = ownLocal ? v : l;
      stats.numeric += 1; stats.gf += gf; stats.gc += gc;
      if (gf > gc) stats.g += 1; else if (gf === gc) stats.e += 1; else stats.p += 1;
      if (!best || gf - gc > best.diff || (gf - gc === best.diff && gf > best.gf)) best = { cat, gf, gc, diff: gf - gc };
    });
    const estado = ptsAll > ptsRival ? "ganada" : ptsAll < ptsRival ? "perdida" : "empatada";
    const frase = estado === "ganada" ? `All Boys ganó la fecha por ${ptsAll} a ${ptsRival}` : estado === "perdida" ? `All Boys perdió la fecha por ${ptsAll} a ${ptsRival}` : "La fecha terminó empatada";
    return { p, allboys, rival, ptsAll, ptsRival, ownLocal, estado, frase, stats, best };
  }

  function enhanceSummaryRenderer() {
    if (typeof window.renderResumenFecha !== "function") return;
    window.renderResumenFecha = function (partidos) {
      const r = buildSummary(partidos);
      if (!r) return "";
      const badge = r.estado === "ganada" ? "FECHA GANADA" : r.estado === "perdida" ? "FECHA PERDIDA" : "FECHA EMPATADA";
      const goles = r.stats.numeric ? `<div class="fecha-stat"><b>${r.stats.gf}-${r.stats.gc}</b><span>Goles</span></div>` : "";
      const best = r.best ? `Mejor categoría: ${esc(r.best.cat)} ${r.best.gf}-${r.best.gc}` : "Mejor categoría: sin datos numéricos";
      return `<article class="fecha-summary ${r.estado}"><div class="fecha-summary-top"><div><h3>Resumen de la Fecha</h3><div class="fecha-summary-match">${esc(r.p.local)} vs ${esc(r.p.visitante)}</div><div class="fecha-summary-score">${esc(r.p.local)} ${esc(r.p.pts_local ?? "-")} pts · ${esc(r.p.visitante)} ${esc(r.p.pts_visitante ?? "-")} pts</div><div class="fecha-summary-score">PJ local ${esc(r.p.pj_local ?? "-")} · PJ visitante ${esc(r.p.pj_visitante ?? "-")}</div></div><span class="fecha-badge">${badge}</span></div><div class="fecha-stats"><div class="fecha-stat"><b>${r.stats.g}</b><span>Ganadas</span></div><div class="fecha-stat"><b>${r.stats.e}</b><span>Empatadas</span></div><div class="fecha-stat"><b>${r.stats.p}</b><span>Perdidas</span></div>${goles}</div><div class="fecha-summary-note"><div>${esc(r.frase)}</div><small>${best}</small></div></article>`;
    };
  }

  function wrapTracking() {
    if (typeof window.mostrarVista === "function" && !window.mostrarVista.__tracked) {
      const original = window.mostrarVista;
      window.mostrarVista = function (vista) {
        const result = original.apply(this, arguments);
        if (["fixture", "resultados", "tablas"].includes(vista)) track(`view_${vista}`, { throttleMs: 5 * 60 * 1000 });
        return result;
      };
      window.mostrarVista.__tracked = true;
    }
    if (typeof window.cambiarZona === "function" && !window.cambiarZona.__tracked) {
      const originalZona = window.cambiarZona;
      window.cambiarZona = async function () {
        const result = await originalZona.apply(this, arguments);
        track("zona_change", { throttleMs: 5 * 60 * 1000 });
        return result;
      };
      window.cambiarZona.__tracked = true;
    }
  }

  async function initLegacyPush() {
    const btn = document.getElementById("push-enable");
    if (!btn || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    btn.hidden = false;
    const status = document.createElement("div");
    status.className = "push-status";
    btn.parentNode.insertAdjacentElement("afterend", status);
    btn.addEventListener("click", async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          status.textContent = "Podés activarlos más adelante.";
          track("push_subscribe_denied");
          return;
        }
        const keyRes = await fetch("/api/push-public-key", { cache: "no-store" });
        const keyData = await keyRes.json();
        if (!keyData.ok || !keyData.publicKey) throw new Error("Avisos no configurados todavía.");
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) });
        const res = await fetch("/api/push-subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) });
        if (!res.ok) throw new Error("No se pudo activar avisos.");
        status.textContent = "Avisos activados";
        btn.hidden = true;
      } catch (error) {
        status.textContent = error.message || "No se pudo activar avisos.";
      }
    });
  }

  function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isStandaloneMode() {
    return matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function compatiblePushMessage() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "Este navegador no es compatible con notificaciones push.";
    if (Notification.permission === "granted") return "Compatible. Permiso concedido.";
    if (Notification.permission === "denied") return "Permiso denegado. Cambialo desde la configuración del navegador.";
    return "Compatible. Permiso pendiente.";
  }

  function ensurePushModal() {
    if (document.getElementById("push-modal")) return;
    const saved = safe(() => JSON.parse(localStorage.getItem("babyAllBoysPushPrefs") || "{}")) || {};
    const modal = document.createElement("div");
    modal.className = "push-modal";
    modal.id = "push-modal";
    modal.innerHTML = `<div class="push-dialog"><button class="push-x" type="button" id="push-close" aria-label="Cerrar">×</button><h2>Activar notificaciones</h2><p>Elegí tu zona y qué avisos querés recibir. Recién al guardar te pedimos permiso.</p><form id="push-form" class="push-form"><fieldset><legend>Zona</legend>${[["c","All Boys A / Zona C"],["i","All Boys B / Zona I"],["mat1","Los Albos / MAT1"],["mat4","All Boys / MAT4"]].map(([value,label])=>`<label class="push-choice"><input type="radio" name="zona" value="${value}" ${saved.zona===value?"checked":""}> <span>${label}</span></label>`).join("")}</fieldset><fieldset><legend>Tipos de aviso</legend>${[["citaciones","Citaciones"],["resultados","Resultados"],["tablas","Tablas"],["jornada","Jornada en vivo"]].map(([value,label])=>`<label class="push-choice"><input type="checkbox" name="avisos" value="${value}" ${(saved.avisos||["citaciones","resultados","jornada"]).includes(value)?"checked":""}> <span>${label}</span></label>`).join("")}</fieldset><button class="push-save" type="submit">Guardar y activar notificaciones</button><button class="push-secondary" type="button" id="push-unsubscribe">Desactivar en este dispositivo</button><div class="push-status" id="push-modal-status"></div></form></div>`;
    document.body.appendChild(modal);
    document.getElementById("push-close").addEventListener("click", closePushModal);
    document.getElementById("push-form").addEventListener("submit", submitPushPrefs);
    document.getElementById("push-unsubscribe").addEventListener("click", unsubscribePush);
    modal.addEventListener("click", (event) => { if (event.target === modal) closePushModal(); });
  }

  function openPushModal() {
    ensurePushModal();
    const status = document.getElementById("push-modal-status");
    status.textContent = isIOSDevice() && !isStandaloneMode()
      ? "Para activar notificaciones en iPhone, primero instalá la app desde Compartir → Agregar a pantalla de inicio. Después abrila desde el ícono."
      : compatiblePushMessage();
    document.getElementById("push-modal").classList.add("abierto");
  }

  function closePushModal() {
    document.getElementById("push-modal")?.classList.remove("abierto");
  }

  async function submitPushPrefs(event) {
    event.preventDefault();
    const status = document.getElementById("push-modal-status");
    const form = event.currentTarget;
    const data = new FormData(form);
    const zona = data.get("zona");
    const avisos = [...form.querySelectorAll('input[name="avisos"]:checked')].map((input) => input.value);
    const equipos = { c: "All Boys A", i: "All Boys B", mat1: "Los Albos", mat4: "All Boys" };
    if (!zona) { status.textContent = "Elegí una zona."; return; }
    if (!avisos.length) { status.textContent = "Elegí al menos un tipo de aviso."; return; }
    if (isIOSDevice() && !isStandaloneMode()) {
      status.textContent = "Para activar notificaciones en iPhone, primero instalá la app desde Compartir → Agregar a pantalla de inicio. Después abrila desde el ícono.";
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      status.textContent = "Este navegador no es compatible con notificaciones push.";
      return;
    }
    try {
      status.textContent = "Preparando notificaciones...";
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        status.textContent = "Permiso denegado. Podés activarlo más adelante.";
        track("push_subscribe_denied");
        return;
      }
      const keyRes = await fetch("/api/push-public-key", { cache: "no-store" });
      const keyData = await keyRes.json().catch(() => ({}));
      if (!keyRes.ok || !keyData.ok || !keyData.publicKey) throw new Error(keyData.error || "VAPID_PUBLIC_KEY no configurada.");
      const reg = await (window.getSWRegistration ? window.getSWRegistration() : navigator.serviceWorker.register("/sw.js"));
      const existing = await reg.pushManager.getSubscription();
      const subscription = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, zona, equipo: equipos[zona], avisos, userAgent: navigator.userAgent }),
      });
      const response = await res.json().catch(() => ({}));
      if (!res.ok || !response.ok) throw new Error(response.error || "No se pudo guardar la suscripción.");
      localStorage.setItem("babyAllBoysPushPrefs", JSON.stringify({ zona, avisos, subscribed: true, updated_at: new Date().toISOString() }));
      status.textContent = "Suscripción activa.";
      track("push_subscribe_success", { meta: { zona, avisos } });
    } catch (error) {
      status.textContent = error.message || "No se pudo activar notificaciones.";
    }
  }

  async function unsubscribePush() {
    const status = document.getElementById("push-modal-status");
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) { status.textContent = "No hay suscripción activa en este dispositivo."; return; }
      await fetch("/api/push/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe();
      localStorage.removeItem("babyAllBoysPushPrefs");
      status.textContent = "Notificaciones desactivadas en este dispositivo.";
    } catch (error) {
      status.textContent = error.message || "No se pudo desactivar.";
    }
  }

  async function initPush() {
    const btn = document.getElementById("push-enable");
    if (!btn || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    btn.hidden = false;
    btn.addEventListener("click", openPushModal);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  function hookInstallTracking() {
    window.addEventListener("beforeinstallprompt", () => track("pwa_install_prompt_shown", { once: "prompt" }));
    window.addEventListener("appinstalled", () => track("pwa_appinstalled", { once: "installed" }));
    document.getElementById("pwa-install-btn")?.addEventListener("click", () => track("pwa_install_accepted", { once: "install-click" }));
    document.getElementById("pwa-install-close")?.addEventListener("click", () => track("pwa_install_dismissed", { once: "install-close" }));
    document.getElementById("pwa-install-later")?.addEventListener("click", () => track("pwa_install_dismissed", { once: "install-later" }));
  }

  function init() {
    injectQuickActions();
    injectReportButtons();
    injectFooter();
    ensureReportModal();
    enhanceSummaryRenderer();
    wrapTracking();
    trackDailyOpen();
    const state = currentState();
    if (["fixture", "resultados", "tablas"].includes(state.vista)) track(`view_${state.vista}`, { throttleMs: 5 * 60 * 1000 });
    if (state.vista === "resultados" && typeof window.renderResultados === "function") setTimeout(() => window.renderResultados(), 0);
    hookInstallTracking();
    initPush();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
