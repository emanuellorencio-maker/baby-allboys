const { sanitizeText } = require("./github");

const REQUIRED_SUPABASE_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const REQUIRED_VAPID_ENV = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"];
const VALID_ZONES = new Set(["c", "i", "mat1", "mat4"]);
const VALID_AVISOS = new Set(["citaciones", "resultados", "tablas", "jornada"]);

function makeError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureEnv(keys, label) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) throw makeError(`${label} no configurado. Faltan: ${missing.join(", ")}`);
}

function ensureSupabaseEnv() {
  ensureEnv(REQUIRED_SUPABASE_ENV, "Supabase");
}

function ensureVapidEnv() {
  ensureEnv(REQUIRED_VAPID_ENV, "Web Push");
}

function getAdminToken(req) {
  const queryToken = (() => {
    try { return new URL(req.url || "/", "https://baby-allboys.local").searchParams.get("token"); }
    catch (error) { return ""; }
  })();
  return req.headers["x-admin-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "") || queryToken || req.body?.token || "";
}

function cleanZona(value) {
  const zona = sanitizeText(value, 12).toLowerCase();
  return VALID_ZONES.has(zona) ? zona : "";
}

function cleanAvisos(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map((item) => sanitizeText(item, 32).toLowerCase()).filter((item) => VALID_AVISOS.has(item)))];
}

function cleanSubscription(raw) {
  if (!raw || typeof raw !== "object") return null;
  const endpoint = sanitizeText(raw.endpoint, 900);
  const p256dh = sanitizeText(raw.keys && raw.keys.p256dh, 400);
  const auth = sanitizeText(raw.keys && raw.keys.auth, 220);
  if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

function normalizeUrl(value) {
  const raw = sanitizeText(value || "/index.html", 240);
  if (!raw || raw.startsWith("http://") || raw.startsWith("//")) return "/index.html";
  if (raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (error) {
      return "/index.html";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

async function supabaseRequest(path, options = {}) {
  ensureSupabaseEnv();
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw makeError(data?.message || data?.hint || `Supabase HTTP ${response.status}`, response.status);
  }
  return data;
}

function eq(value) {
  return encodeURIComponent(`eq.${value}`);
}

function maskEndpoint(endpoint) {
  const clean = sanitizeText(endpoint, 180);
  if (clean.length <= 28) return clean;
  return `${clean.slice(0, 34)}...${clean.slice(-10)}`;
}

module.exports = {
  VALID_AVISOS,
  cleanAvisos,
  cleanSubscription,
  cleanZona,
  ensureSupabaseEnv,
  ensureVapidEnv,
  getAdminToken,
  maskEndpoint,
  normalizeUrl,
  supabaseRequest,
  eq,
};
