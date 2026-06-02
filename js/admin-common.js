(function () {
  const TOKEN_KEY = "babyAdminToken";
  const META_KEY = "babyAdminSessionMeta";
  const LEGACY_FLAG_KEYS = ["babyAdminSession", "babyAllBoysFlyerAdminSession"];
  const SESSION_DURATION_MS = 10 * 60 * 60 * 1000;

  function readMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeMeta(durationMs) {
    const now = Date.now();
    localStorage.setItem(META_KEY, JSON.stringify({
      createdAt: now,
      expiresAt: now + durationMs,
      version: 1
    }));
  }

  function clearLegacyFlags() {
    LEGACY_FLAG_KEYS.forEach(key => sessionStorage.removeItem(key));
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    clearLegacyFlags();
    localStorage.removeItem(META_KEY);
  }

  function isExpired(meta) {
    return !meta || !Number.isFinite(Number(meta.expiresAt)) || Number(meta.expiresAt) <= Date.now();
  }

  function getSessionToken() {
    const meta = readMeta();
    if (isExpired(meta)) {
      clearSession();
      return "";
    }
    return String(sessionStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function hasSession() {
    return Boolean(getSessionToken());
  }

  async function validateToken(token) {
    const clean = String(token || "").trim();
    if (!clean) throw new Error("Ingresa la clave.");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: clean })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Clave incorrecta.");
    return clean;
  }

  async function login(token, options) {
    const durationMs = options && Number.isFinite(Number(options.durationMs))
      ? Number(options.durationMs)
      : SESSION_DURATION_MS;
    const clean = await validateToken(token);
    sessionStorage.setItem(TOKEN_KEY, clean);
    clearLegacyFlags();
    writeMeta(durationMs);
    return clean;
  }

  async function restoreSession(options) {
    const settings = options || {};
    const statusEl = settings.statusEl || null;
    const onAuthed = typeof settings.onAuthed === "function" ? settings.onAuthed : null;
    const onGuest = typeof settings.onGuest === "function" ? settings.onGuest : null;
    const token = getSessionToken();

    if (!token) {
      if (statusEl) statusEl.textContent = "";
      if (onGuest) onGuest();
      return null;
    }

    if (statusEl) statusEl.textContent = settings.restoreMessage || "Validando sesion guardada...";
    try {
      const clean = await validateToken(token);
      writeMeta(SESSION_DURATION_MS);
      if (statusEl) statusEl.textContent = "";
      if (onAuthed) onAuthed(clean);
      return clean;
    } catch (error) {
      clearSession();
      if (statusEl) statusEl.textContent = "";
      if (onGuest) onGuest(error);
      return null;
    }
  }

  function bindLogout(target, options) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    const settings = options || {};
    el.addEventListener("click", function () {
      clearSession();
      if (typeof settings.onLoggedOut === "function") {
        settings.onLoggedOut();
        return;
      }
      if (settings.redirectTo) {
        location.href = settings.redirectTo;
        return;
      }
      location.reload();
    });
  }

  window.BabyAdminCommon = {
    META_KEY: META_KEY,
    SESSION_DURATION_MS: SESSION_DURATION_MS,
    TOKEN_KEY: TOKEN_KEY,
    bindLogout: bindLogout,
    clearSession: clearSession,
    getSessionToken: getSessionToken,
    hasSession: hasSession,
    login: login,
    restoreSession: restoreSession,
    validateToken: validateToken
  };
}());
