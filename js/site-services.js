/* Shared service UI for the redesigned home. Existing API routes and preference keys only. */
(function () {
  'use strict';
  const services = window.BabyServices = window.BabyServices || {};
  const THEME_KEY = 'babyAllBoysTheme';
  const PWA_DISMISSED_KEY = 'babyAllBoysPwaDismissedUntil';
  const IOS_DISMISSED_KEY = 'babyAllBoysIosInstallDismissedUntil';
  const INSTALL_SNOOZE_MS = 4 * 24 * 60 * 60 * 1000;
  const INSTALL_CLOSE_MS = 7 * 24 * 60 * 60 * 1000;
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const embeddedIOS = isIOS && /(instagram|fban|fbav|fb_iab|facebook|whatsapp)/i.test(ua);
  let activeDialog = null;
  let registrationPromise = null;
  let installPrompt = null;
  let installPending = false;
  let installed = false;
  const modalState = new WeakMap();
  const busyControls = new WeakMap();
  const safe = fn => { try { return fn(); } catch (_) { return null; } };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage = {
    get: key => safe(() => localStorage.getItem(key)),
    set: (key, value) => safe(() => { localStorage.setItem(key, value); return true; }),
    remove: key => safe(() => { localStorage.removeItem(key); return true; })
  };
  const standalone = () => installed || Boolean(safe(() => matchMedia('(display-mode: standalone)').matches)) || navigator.standalone === true;
  const currentState = () => {
    const state = window.BABY?.state || {};
    return { zona: state.z || '', vista: state.view || '', fecha: state.round || '', categoria: state.cat === 'general' ? '' : (state.cat || ''), modo: standalone() ? 'standalone' : 'browser' };
  };

  async function requestJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'No se pudo enviar. Probá de nuevo más tarde.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('La conexión tardó demasiado. No pudimos confirmar el envío; revisá tu conexión antes de volver a intentar.');
      if (error instanceof TypeError) throw new Error('No se pudo conectar. Revisá tu conexión e intentá de nuevo.');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function focusable(modal) {
    return [...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')]
      .filter(el => !el.hidden && !el.closest('[hidden]') && el.getClientRects().length);
  }
  function prepareDialog(modal, titleID) {
    modal.classList.add('baby-service-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', titleID);
    modal.setAttribute('aria-hidden', 'true');
    modal.tabIndex = -1;
    modal.hidden = true;
    modalState.set(modal, { revision: 0 });
    modal.addEventListener('click', event => { if (event.target === modal) closeDialog(modal); });
    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDialog(modal); return; }
      if (event.key !== 'Tab') return;
      const controls = focusable(modal), first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); modal.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === modal)) { event.preventDefault(); first.focus(); }
    });
    return modal;
  }
  function openDialog(modal, focusTarget) {
    if (activeDialog === modal) return;
    if (activeDialog) closeDialog(activeDialog);
    const state = modalState.get(modal);
    state.revision += 1;
    state.focus = document.activeElement;
    state.overflow = document.body.style.overflow;
    state.background = [...document.body.children].filter(el => el !== modal).map(el => ({ el, inert: el.inert }));
    state.background.forEach(({ el }) => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    activeDialog = modal;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('abierto');
    ((focusTarget && !focusTarget.disabled ? focusTarget : null) || focusable(modal)[0] || modal).focus({ preventScroll: true });
  }
  function closeDialog(modal) {
    if (activeDialog !== modal) return;
    const state = modalState.get(modal);
    state.revision += 1;
    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    state.background.forEach(({ el, inert }) => { el.inert = inert; });
    document.body.style.overflow = state.overflow;
    activeDialog = null;
    if (state.focus?.isConnected && !state.focus.inert) state.focus.focus({ preventScroll: true });
    state.background = [];
    state.focus = null;
  }
  function dialogRevision(modal) { return modalState.get(modal)?.revision; }
  function closeAfterSuccess(modal, revision) {
    setTimeout(() => { if (activeDialog === modal && dialogRevision(modal) === revision) closeDialog(modal); }, 900);
  }
  function busy(form, value) {
    form.setAttribute('aria-busy', String(value));
    if (value) {
      const controls = [...form.querySelectorAll('button[type="submit"],[data-busy-disable],input,select,textarea')].map(el => ({ el, disabled: el.disabled }));
      busyControls.set(form, controls);
      controls.forEach(({ el }) => { el.disabled = true; });
    } else {
      (busyControls.get(form) || []).forEach(({ el, disabled }) => { el.disabled = disabled; });
      busyControls.delete(form);
    }
  }

  function applyTheme(theme, persist = false) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = normalized;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', normalized === 'light' ? '#f4f4f1' : '#111111');
    if (persist) storage.set(THEME_KEY, normalized);
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(normalized === 'dark'));
      button.setAttribute('aria-label', normalized === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      button.title = normalized === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
      const label = button.querySelector('[data-theme-label]');
      if (label) label.textContent = normalized === 'dark' ? 'Oscuro' : 'Claro';
    }
    return normalized;
  }
  function toggleTheme() { return applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true); }
  // Apply before DOMContentLoaded; absent/invalid saved values use the approved light design.
  applyTheme(storage.get(THEME_KEY) === 'dark' ? 'dark' : 'light');
  window.addEventListener('storage', event => { if (event.key === THEME_KEY) applyTheme(event.newValue); });

  function getSWRegistration() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('Service Worker no compatible.'));
    if (!registrationPromise) {
      registrationPromise = navigator.serviceWorker.register('/sw.js').catch(error => { registrationPromise = null; throw error; });
    }
    return registrationPromise;
  }
  async function getReadyRegistration() {
    const registration = await getSWRegistration();
    if (registration.active) return registration;
    let timer;
    try {
      return await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('La app todavía no está lista para recibir notificaciones. Volvé a intentar en unos segundos.')), 12000); })
      ]);
    } finally { clearTimeout(timer); }
  }

  function installDismissKey() { return isIOS ? IOS_DISMISSED_KEY : PWA_DISMISSED_KEY; }
  function dismissInstall(ttl) {
    if (ttl > 0) storage.set(installDismissKey(), String(Date.now() + ttl));
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.hidden = true;
  }
  function getInstallEntryState() {
    return { visible: !standalone(), ready: Boolean(installPrompt), label: 'Instalar app', detail: embeddedIOS ? 'Abrila en Safari' : installPrompt ? 'Disponible ahora' : 'Cómo instalar' };
  }
  function refreshServiceButtons() {
    applyTheme(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-service="install"]').forEach(button => { button.hidden = standalone(); });
    // Keep push settings reachable even in unsupported browsers, where the dialog explains why.
    document.querySelectorAll('[data-service="push"]').forEach(button => { button.hidden = false; });
  }
  function ensureInstallBanner() {
    let banner = document.getElementById('pwa-install-banner');
    if (banner) return banner;
    banner = document.createElement('aside');
    banner.id = 'pwa-install-banner';
    banner.className = 'baby-install-banner';
    banner.setAttribute('aria-label', 'Instalar Baby All Boys');
    banner.hidden = true;
    banner.innerHTML = '<div><strong>Baby All Boys, siempre a mano.</strong><p>Guardá la app en tu pantalla de inicio.</p></div><div class="service-banner-actions"><button type="button" id="pwa-install-btn">Instalar app</button><button type="button" id="pwa-install-later">Más tarde</button><button type="button" id="pwa-install-close" aria-label="Cerrar sugerencia de instalación">×</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('#pwa-install-btn').addEventListener('click', openInstall);
    banner.querySelector('#pwa-install-later').addEventListener('click', () => { dismissInstall(INSTALL_SNOOZE_MS); services.track?.('pwa_install_dismissed', { once: 'install-later' }); });
    banner.querySelector('#pwa-install-close').addEventListener('click', () => { dismissInstall(INSTALL_CLOSE_MS); services.track?.('pwa_install_dismissed', { once: 'install-close' }); });
    return banner;
  }
  function showInstallBanner() {
    if (standalone() || Number(storage.get(installDismissKey()) || 0) > Date.now()) return;
    if (!isIOS && !installPrompt) return;
    const banner = ensureInstallBanner();
    // Do not add interactive siblings behind an already-open modal.
    if (activeDialog) { banner.hidden = true; return; }
    banner.hidden = false;
  }
  function ensureInstallModal() {
    let modal = document.getElementById('install-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.innerHTML = '<div class="baby-service-dialog install-sheet"><button type="button" class="service-close" id="install-modal-close" aria-label="Cerrar instalación">×</button><span class="service-kicker" id="install-modal-kicker"></span><h2 id="install-modal-title"></h2><p id="install-modal-description"></p><p class="service-note" id="install-modal-note"></p><ol class="install-steps" id="install-modal-steps"></ol><div class="service-actions"><button type="button" id="install-copy-link">Copiar link</button><button type="button" id="install-dismiss-days">Recordármelo más adelante</button></div><div class="service-status" id="install-modal-status" role="status" aria-live="polite"></div></div>';
    prepareDialog(modal, 'install-modal-title');
    document.body.appendChild(modal);
    modal.querySelector('#install-modal-close').addEventListener('click', () => closeDialog(modal));
    modal.querySelector('#install-dismiss-days').addEventListener('click', () => { dismissInstall(INSTALL_SNOOZE_MS); closeDialog(modal); });
    modal.querySelector('#install-copy-link').addEventListener('click', async () => {
      const status = modal.querySelector('#install-modal-status');
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(location.href);
        else {
          const input = document.createElement('textarea');
          input.value = location.href;
          input.className = 'service-copy-input';
          modal.appendChild(input); input.select();
          const copied = document.execCommand('copy'); input.remove();
          modal.querySelector('#install-copy-link').focus();
          if (!copied) throw new Error('copy failed');
        }
        status.textContent = isIOS ? 'Link copiado. Podés pegarlo y abrirlo en Safari.' : 'Link copiado.';
      } catch (_) { status.textContent = 'No se pudo copiar el link. Podés copiarlo desde la barra del navegador.'; }
    });
    return modal;
  }
  function openInstallHelp(message = '') {
    const modal = ensureInstallModal();
    modal.querySelector('#install-modal-kicker').textContent = embeddedIOS ? 'Abrila en Safari' : isIOS ? 'iPhone / iPad' : 'Android / navegador';
    modal.querySelector('#install-modal-title').textContent = isIOS ? 'Instalá Baby All Boys en tu iPhone o iPad' : 'Instalá Baby All Boys como app';
    modal.querySelector('#install-modal-description').textContent = 'Guardala en la pantalla de inicio para abrir fixture, tablas y resultados como una app.';
    modal.querySelector('#install-modal-note').textContent = isIOS
      ? (embeddedIOS ? 'Para instalarla, abrila primero en Safari. Después seguí estos pasos.' : 'En Safari, agregala desde el menú Compartir.')
      : 'En navegadores compatibles suele aparecer “Instalar app” o “Agregar a pantalla principal” en el menú. La opción depende del navegador.';
    const steps = isIOS ? [
      ['Abrí esta página en Safari', 'Si estás en Instagram, WhatsApp o Facebook, abrila primero en Safari.'],
      ['Tocá Compartir', 'Buscá el ícono de compartir en la barra del navegador.'],
      ['Elegí “Agregar a pantalla de inicio”', 'Deslizá el menú hasta encontrar esa opción.'],
      ['Activá “Abrir como app” si aparece', 'En algunas versiones de iOS aparece como opción extra.'],
      ['Confirmá con “Agregar”', 'Después abrila desde el ícono de tu pantalla de inicio.']
    ] : [
      ['Abrí el menú del navegador', 'En Android suele ser el botón de tres puntos.'],
      ['Buscá “Instalar app”', 'Si no aparece, probá con “Agregar a pantalla principal”.'],
      ['Confirmá la instalación', 'Aceptá el nombre y agregala al inicio.']
    ];
    modal.querySelector('#install-modal-steps').innerHTML = steps.map(([title, text]) => `<li><strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span></li>`).join('');
    modal.querySelector('#install-modal-status').textContent = message;
    openDialog(modal, modal.querySelector('#install-modal-close'));
  }
  async function openInstall() {
    if (standalone() || installPending) return;
    if (isIOS || !installPrompt) { openInstallHelp(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    installPending = true;
    try {
      services.track?.('pwa_install_prompt_shown', { once: 'prompt' });
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === 'accepted') {
        services.track?.('pwa_install_accepted', { once: 'install-click' });
        dismissInstall(0);
      } else {
        services.track?.('pwa_install_dismissed', { once: 'native-prompt' });
        dismissInstall(INSTALL_SNOOZE_MS);
      }
    } catch (_) { openInstallHelp('No se pudo abrir el instalador. Podés seguir estos pasos.'); }
    finally { installPending = false; refreshServiceButtons(); }
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; if (document.readyState !== 'loading') { showInstallBanner(); refreshServiceButtons(); } });
  window.addEventListener('appinstalled', () => {
    installed = true; installPrompt = null; dismissInstall(0);
    const modal = document.getElementById('install-modal'); if (modal) closeDialog(modal);
    services.track?.('pwa_appinstalled', { once: 'installed' }); refreshServiceButtons();
  });

  function ensureSuggestionModal() {
    let modal = document.getElementById('suggestion-modal');
    if (modal) return modal;
    modal = document.createElement('div'); modal.id = 'suggestion-modal';
    modal.innerHTML = '<div class="baby-service-dialog suggestion-dialog"><h2 id="suggestion-title">Enviar sugerencia</h2><form id="suggestion-form" class="service-form"><label>Nombre <input id="suggestion-name" name="nombre" autocomplete="name" placeholder="Opcional"></label><label>Mensaje <textarea id="suggestion-message" name="mensaje" required placeholder="Escribí tu sugerencia"></textarea></label><div class="service-actions"><button type="button" id="suggestion-close">Cerrar</button><button type="submit" class="service-primary">Enviar</button></div><div class="service-status" id="suggestion-status" role="status" aria-live="polite"></div></form></div>';
    prepareDialog(modal, 'suggestion-title'); document.body.appendChild(modal);
    modal.querySelector('#suggestion-close').addEventListener('click', () => closeDialog(modal));
    modal.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (form.getAttribute('aria-busy') === 'true') return;
      const status = modal.querySelector('#suggestion-status');
      const nombre = modal.querySelector('#suggestion-name').value.trim();
      const mensaje = modal.querySelector('#suggestion-message').value.trim();
      if (!mensaje) { status.textContent = 'Escribí un mensaje para enviar.'; modal.querySelector('#suggestion-message').focus(); return; }
      const state = currentState(), revision = dialogRevision(modal);
      busy(form, true); status.textContent = 'Enviando...';
      try {
        const response = await requestJSON('/api/enviar-sugerencia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, mensaje, zonaActual: state.zona, vistaActual: state.vista, fechaHora: new Date().toISOString() }) });
        if (!response?.ok || response.delivered !== true) throw new Error(response?.error || 'No se pudo entregar la sugerencia. El mensaje se conserva para volver a intentar.');
        status.textContent = 'Gracias por tu sugerencia'; form.reset(); closeAfterSuccess(modal, revision);
      } catch (error) { status.textContent = error.message || 'No se pudo enviar la sugerencia. Tu mensaje sigue acá.'; }
      finally { busy(form, false); }
    });
    return modal;
  }
  function openSuggestion() {
    const modal = ensureSuggestionModal();
    if (modal.querySelector('form').getAttribute('aria-busy') !== 'true') modal.querySelector('#suggestion-status').textContent = '';
    openDialog(modal, modal.querySelector('#suggestion-message'));
  }

  Object.assign(services, { safe, storage, escapeHTML, currentState, requestJSON, prepareDialog, openDialog, closeDialog, dialogRevision, closeAfterSuccess, busy, isIOS, isStandalone: standalone, getSWRegistration, getReadyRegistration, applyTheme, toggleTheme, openInstall, openSuggestion, getInstallEntryState, refresh: refreshServiceButtons });
  // Compatibility for existing callers; no old shell or renderer is injected.
  window.getSWRegistration = getSWRegistration;
  window.getInstallEntryState = getInstallEntryState;
  window.abrirInstalacionApp = openInstall;
  window.abrirSugerencias = openSuggestion;
  window.cerrarSugerencias = () => { const modal = document.getElementById('suggestion-modal'); if (modal) closeDialog(modal); };
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button,a');
    if (!button) return;
    if (button.id === 'theme-toggle') { event.preventDefault(); toggleTheme(); return; }
    const action = button.dataset.service;
    const methods = { report: 'openReport', push: 'openPush', install: 'openInstall', suggestion: 'openSuggestion' };
    if (methods[action]) { event.preventDefault(); services[methods[action]]?.(); }
  });
  window.addEventListener('baby:statechange', refreshServiceButtons);
  document.addEventListener('baby:statechange', refreshServiceButtons);
  function init() { refreshServiceButtons(); showInstallBanner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  function register() { if ('serviceWorker' in navigator) getSWRegistration().catch(() => {}); }
  if (document.readyState === 'complete') register(); else window.addEventListener('load', register, { once: true });
})();
