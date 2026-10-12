/* Report and push behavior adapted from the existing app-enhancements.js.
   The redesigned shell owns navigation, quick actions, footer and all sports rendering. */
(function () {
  'use strict';
  const services = window.BabyServices;
  if (!services) { console.error('Load js/site-services.js before js/redesign-services.js.'); return; }
  const { safe, storage, currentState, requestJSON, prepareDialog, openDialog, closeDialog, dialogRevision, closeAfterSuccess, busy } = services;
  const REPORT_TYPES = ['Resultado mal cargado', 'Fixture incorrecto', 'Tabla incorrecta', 'Horario/dirección incorrecta', 'Otro'];
  const TRACK_KEY = 'babyAllBoysDeviceId';
  const DAY_KEY = 'babyAllBoysAppOpenDay';
  const THROTTLE_PREFIX = 'babyAllBoysTrack:';
  const PUSH_PREFS_KEY = 'babyAllBoysPushPrefs';
  const EQUIPOS = { c: 'All Boys A', i: 'All Boys B', mat1: 'Los Albos', mat4: 'All Boys' };
  const AVISOS = ['citaciones', 'resultados', 'tablas', 'jornada'];
  let volatileDeviceID = '';
  let previousZone = '';
  let lastOpenDay = '';
  const recentEvents = new Map();

  function getDeviceId() {
    let id = storage.get(TRACK_KEY) || volatileDeviceID;
    if (!id) {
      id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      volatileDeviceID = id; storage.set(TRACK_KEY, id);
    }
    return id;
  }
  function track(event, opts = {}) {
    // Existing analytics contract. No exceptions from storage/network may affect the UI.
    safe(() => {
      const state = currentState();
      const key = `${THROTTLE_PREFIX}${event}:${opts.once || state.zona || 'global'}:${state.vista || 'home'}`;
      const now = Date.now();
      const last = Number(safe(() => sessionStorage.getItem(key)) || recentEvents.get(key) || 0);
      if (opts.throttleMs && now - last < opts.throttleMs) return;
      recentEvents.set(key, now);
      safe(() => sessionStorage.setItem(key, String(now)));
      const payload = JSON.stringify({ event, zona: state.zona, vista: state.vista, modo: state.modo, device_id: getDeviceId(), meta: opts.meta || {} });
      if (navigator.sendBeacon && navigator.sendBeacon('/api/track-event', new Blob([payload], { type: 'application/json' }))) return;
      fetch('/api/track-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    });
  }
  function trackState() {
    const state = currentState();
    if (!state.zona) return;
    const today = new Date().toISOString().slice(0, 10);
    if (storage.get(DAY_KEY) !== today && lastOpenDay !== today) { lastOpenDay = today; storage.set(DAY_KEY, today); track('app_open', { once: today, throttleMs: 86400000 }); }
    if (previousZone && previousZone !== state.zona) track('zona_change', { throttleMs: 5 * 60 * 1000 });
    previousZone = state.zona;
    if (['fixture', 'resultados', 'tablas'].includes(state.vista)) track(`view_${state.vista}`, { throttleMs: 5 * 60 * 1000 });
  }

  function ensureReportModal() {
    let modal = document.getElementById('report-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'report-modal'; modal.className = 'report-modal';
    modal.innerHTML = `<div class="baby-service-dialog report-dialog"><h2 id="report-title">Reportar error</h2><form class="service-form report-form" id="report-form"><label>Tipo de error <select id="report-type">${REPORT_TYPES.map(type => `<option>${type}</option>`).join('')}</select></label><label>Comentario <textarea id="report-comment" maxlength="500" required placeholder="Contanos qué dato está mal."></textarea></label><label>Contacto opcional <input id="report-contact" maxlength="120" placeholder="Nombre o WhatsApp"></label><div class="service-actions report-actions"><button class="report-cancel" type="button" id="report-cancel">Cancelar</button><button class="service-primary report-submit" type="submit">Enviar</button></div><div class="service-status report-status" id="report-status" role="status" aria-live="polite"></div></form></div>`;
    prepareDialog(modal, 'report-title'); document.body.appendChild(modal);
    modal.querySelector('#report-cancel').addEventListener('click', () => closeDialog(modal));
    modal.querySelector('#report-form').addEventListener('submit', submitReport);
    return modal;
  }
  function openReportModal() {
    const modal = ensureReportModal();
    if (modal.querySelector('form').getAttribute('aria-busy') !== 'true') modal.querySelector('#report-status').textContent = '';
    openDialog(modal, modal.querySelector('#report-comment'));
  }
  async function submitReport(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.getAttribute('aria-busy') === 'true') return;
    const modal = document.getElementById('report-modal');
    const status = document.getElementById('report-status');
    const commentField = document.getElementById('report-comment');
    const comentario = commentField.value.trim();
    if (comentario.length < 5) { status.textContent = 'El comentario debe tener al menos 5 caracteres.'; commentField.focus(); return; }
    if (comentario.length > 500) { status.textContent = 'El comentario no puede superar 500 caracteres.'; commentField.focus(); return; }
    const state = currentState(), revision = dialogRevision(modal);
    busy(form, true); status.textContent = 'Enviando...';
    try {
      const data = await requestJSON('/api/reportar-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        zona: state.zona, vista: state.vista, fecha: state.fecha, categoria: state.categoria,
        tipo: document.getElementById('report-type').value, comentario,
        contacto: document.getElementById('report-contact').value.trim()
      }) });
      if (!data?.ok) throw new Error(data?.error || 'No se pudo confirmar el reporte. Tu comentario sigue acá para volver a intentar.');
      status.textContent = 'Reporte enviado correctamente'; form.reset(); closeAfterSuccess(modal, revision);
    } catch (error) { status.textContent = error.message || 'Error al enviar'; }
    finally { busy(form, false); }
  }

  function compatiblePushMessage() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'Este navegador no es compatible con notificaciones push.';
    if (Notification.permission === 'granted') return 'Compatible. Permiso concedido.';
    if (Notification.permission === 'denied') return 'Permiso denegado. Cambialo desde la configuración del navegador.';
    return 'Compatible. Permiso pendiente.';
  }
  function savedPushPrefs() {
    const value = safe(() => JSON.parse(storage.get(PUSH_PREFS_KEY) || '{}'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function ensurePushModal() {
    let modal = document.getElementById('push-modal');
    if (modal) return modal;
    const saved = savedPushPrefs();
    const savedZone = EQUIPOS[saved.zona] ? saved.zona : currentState().zona;
    const savedTypes = Array.isArray(saved.avisos) ? saved.avisos.filter(type => AVISOS.includes(type)) : ['citaciones', 'resultados', 'jornada'];
    modal = document.createElement('div'); modal.id = 'push-modal'; modal.className = 'push-modal';
    modal.innerHTML = `<div class="baby-service-dialog push-dialog"><button class="service-close push-x" type="button" id="push-close" aria-label="Cerrar notificaciones">×</button><h2 id="push-title">Activar notificaciones</h2><p>Elegí tu zona y qué avisos querés recibir. Recién al guardar te pedimos permiso.</p><form id="push-form" class="service-form push-form"><fieldset><legend>Zona</legend>${[['c','All Boys A / Zona D'],['i','All Boys B / Zona I'],['mat1','Los Albos / MAT1'],['mat4','All Boys / MAT4']].map(([value,label]) => `<label class="push-choice"><input type="radio" name="zona" value="${value}" ${savedZone === value ? 'checked' : ''}> <span>${label}</span></label>`).join('')}</fieldset><fieldset><legend>Tipos de aviso</legend>${[['citaciones','Citaciones'],['resultados','Resultados'],['tablas','Tablas'],['jornada','Jornada en vivo']].map(([value,label]) => `<label class="push-choice"><input type="checkbox" name="avisos" value="${value}" ${savedTypes.includes(value) ? 'checked' : ''}> <span>${label}</span></label>`).join('')}</fieldset><button class="service-primary push-save" type="submit">Guardar y activar notificaciones</button><button class="push-secondary" type="button" id="push-unsubscribe" data-busy-disable>Desactivar en este dispositivo</button><div class="service-status push-status" id="push-modal-status" role="status" aria-live="polite"></div></form></div>`;
    prepareDialog(modal, 'push-title'); document.body.appendChild(modal);
    modal.querySelector('#push-close').addEventListener('click', () => closeDialog(modal));
    modal.querySelector('#push-form').addEventListener('submit', submitPushPrefs);
    modal.querySelector('#push-unsubscribe').addEventListener('click', unsubscribePush);
    return modal;
  }
  function openPushModal() {
    const modal = ensurePushModal();
    if (modal.querySelector('form').getAttribute('aria-busy') !== 'true') {
      modal.querySelector('#push-modal-status').textContent = services.isIOS && !services.isStandalone()
        ? 'Para activar notificaciones en iPhone, primero instalá la app desde Compartir → Agregar a pantalla de inicio. Después abrila desde el ícono.'
        : compatiblePushMessage();
    }
    openDialog(modal, modal.querySelector('input[name="zona"]:checked') || modal.querySelector('input[name="zona"]'));
  }
  async function submitPushPrefs(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.getAttribute('aria-busy') === 'true') return;
    const modal = document.getElementById('push-modal'), status = document.getElementById('push-modal-status');
    const zona = new FormData(form).get('zona');
    const avisos = [...form.querySelectorAll('input[name="avisos"]:checked')].map(input => input.value).filter(value => AVISOS.includes(value));
    if (!EQUIPOS[zona]) { status.textContent = 'Elegí una zona.'; return; }
    if (!avisos.length) { status.textContent = 'Elegí al menos un tipo de aviso.'; return; }
    if (services.isIOS && !services.isStandalone()) {
      status.textContent = 'Para activar notificaciones en iPhone, primero instalá la app desde Compartir → Agregar a pantalla de inicio. Después abrila desde el ícono.'; return;
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { status.textContent = 'Este navegador no es compatible con notificaciones push.'; return; }
    if (Notification.permission === 'denied') { status.textContent = 'Permiso denegado. Cambialo desde la configuración del navegador.'; return; }
    busy(form, true); status.textContent = 'Preparando notificaciones...';
    try {
      // This is the only permission request: reached solely by submitting the preferences form.
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') {
        status.textContent = 'Permiso no concedido. Podés activarlo más adelante.';
        track('push_subscribe_denied'); return;
      }
      const keyData = await requestJSON('/api/push-public-key', { cache: 'no-store' });
      if (!keyData?.ok || !keyData.publicKey) throw new Error(keyData?.error || 'Avisos no configurados todavía.');
      const registration = await services.getReadyRegistration();
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) });
      const response = await requestJSON('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription, zona, equipo: EQUIPOS[zona], avisos, userAgent: navigator.userAgent }) });
      if (!response?.ok) throw new Error(response?.error || 'No se pudo guardar la suscripción.');
      const saved = storage.set(PUSH_PREFS_KEY, JSON.stringify({ zona, avisos, subscribed: true, updated_at: new Date().toISOString() }));
      status.textContent = saved ? 'Suscripción activa.' : 'Suscripción activa. Este navegador no permitió guardar tus preferencias locales.';
      track('push_subscribe_success', { meta: { zona, avisos } });
    } catch (error) { status.textContent = error.message || 'No se pudo activar notificaciones.'; }
    finally { busy(form, false); }
  }
  async function unsubscribePush() {
    const modal = document.getElementById('push-modal'), form = document.getElementById('push-form'), status = document.getElementById('push-modal-status');
    if (form.getAttribute('aria-busy') === 'true') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { status.textContent = 'Este navegador no es compatible con notificaciones push.'; return; }
    busy(form, true); status.textContent = 'Desactivando notificaciones...';
    try {
      const registration = await services.getReadyRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        storage.remove(PUSH_PREFS_KEY);
        status.textContent = 'No hay suscripción activa en este dispositivo.';
        return;
      }
      const response = await requestJSON('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      if (!response?.ok) throw new Error(response?.error || 'No se pudo confirmar la baja. Volvé a intentar.');
      const unsubscribed = await subscription.unsubscribe();
      if (!unsubscribed && await registration.pushManager.getSubscription()) throw new Error('Se desactivó el envío, pero el navegador no completó la baja local. Volvé a intentar.');
      storage.remove(PUSH_PREFS_KEY);
      status.textContent = 'Notificaciones desactivadas en este dispositivo.';
    } catch (error) { status.textContent = error.message || 'No se pudo desactivar.'; }
    finally { busy(form, false); }
  }
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  Object.assign(services, { openReport: openReportModal, openPush: openPushModal, track });
  document.addEventListener('baby:statechange', trackState);
  window.addEventListener('baby:statechange', trackState);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackState, { once: true }); else trackState();
})();
