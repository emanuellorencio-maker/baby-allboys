const crypto = require("crypto");

const TOTAL_STICKERS = 980;
const ALLOWED_STATUS = new Set(["owned", "duplicate"]);

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function method(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader("Allow", allowed.join(", "));
  json(res, 405, { ok: false, error: "Metodo no permitido" });
  return false;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

async function supabase(path, options = {}) {
  const config = supabaseConfig();
  if (!config) {
    const error = new Error("Supabase no configurado");
    error.code = "NO_SUPABASE";
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || "Error de Supabase");
    error.status = response.status;
    error.detail = data;
    throw error;
  }
  return data;
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function validateProfileInput(body) {
  const nickname = normalizeText(body.nickname).slice(0, 22);
  const category = normalizeText(body.category);
  const team = normalizeText(body.team);
  const pin = String(body.pin || "").trim();
  if (nickname.length < 2) return { error: "Usa un apodo corto." };
  if (!category) return { error: "Elegí una categoria." };
  if (!team) return { error: "Elegí equipo o zona." };
  if (!/^\d{4}$/.test(pin)) return { error: "El PIN tiene que tener 4 digitos." };
  return { nickname, category, team, pin };
}

function hashPin(pin, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
  return `sha256$${salt}$${hash}`;
}

function verifyPin(pin, pinHash) {
  const [algo, salt, saved] = String(pinHash || "").split("$");
  if (algo !== "sha256" || !salt || !saved) return false;
  const check = hashPin(pin, salt).split("$")[2];
  return crypto.timingSafeEqual(Buffer.from(saved), Buffer.from(check));
}

function publicProfile(row, album = {}) {
  return {
    id: row.id,
    nickname: row.nickname,
    category: row.category,
    team: row.team,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    album,
  };
}

function albumFromRows(rows = []) {
  const album = {};
  rows.forEach((row) => {
    if (row.status === "owned" || row.status === "duplicate") {
      album[row.sticker_number] = row.status;
    }
  });
  return album;
}

async function fetchProfilesWithAlbums() {
  const profiles = await supabase("profiles?is_active=eq.true&select=id,nickname,category,team,is_active,created_at,updated_at&order=created_at.desc", {
    method: "GET",
  });
  const stickers = await supabase("stickers?select=profile_id,sticker_number,status,quantity", { method: "GET" });
  const byProfile = {};
  stickers.forEach((row) => {
    byProfile[row.profile_id] ||= [];
    byProfile[row.profile_id].push(row);
  });
  return profiles.map((profile) => publicProfile(profile, albumFromRows(byProfile[profile.id] || [])));
}

function profileStats(profile) {
  const values = Object.values(profile?.album || {});
  const owned = values.filter((v) => v === "owned" || v === "duplicate").length;
  const duplicates = values.filter((v) => v === "duplicate").length;
  return { owned, duplicates, missing: TOTAL_STICKERS - owned, percent: Math.round((owned / TOTAL_STICKERS) * 100) };
}

function profileSets(profile) {
  const missing = [];
  const duplicates = [];
  for (let number = 1; number <= TOTAL_STICKERS; number += 1) {
    const status = profile.album?.[number] || "missing";
    if (status === "missing") missing.push(number);
    if (status === "duplicate") duplicates.push(number);
  }
  return { missing, duplicates };
}

function calculateMatches(profiles, profileId) {
  const me = profiles.find((profile) => profile.id === profileId);
  if (!me) return [];
  const mine = profileSets(me);
  return profiles
    .filter((other) => other.id !== me.id && other.isActive !== false)
    .map((other) => {
      const their = profileSets(other);
      const givesMe = their.duplicates.filter((n) => mine.missing.includes(n));
      const iGive = mine.duplicates.filter((n) => their.missing.includes(n));
      const ideal = givesMe.length > 0 && iGive.length > 0;
      const type = ideal ? "Cambio ideal" : givesMe.length ? "Me sirve" : iGive.length ? "Yo le sirvo" : "";
      const explain = ideal
        ? "Cambio redondo: a los dos les sirve."
        : givesMe.length
          ? "Te puede ayudar con figuritas que te faltan."
          : "Vos tenes repetidas que le sirven.";
      return { other, givesMe, iGive, ideal, type, explain, score: givesMe.length + iGive.length };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => Number(b.ideal) - Number(a.ideal)
      || b.score - a.score
      || Number(b.other.category === me.category) - Number(a.other.category === me.category)
      || Number(b.other.team === me.team) - Number(a.other.team === me.team));
}

function sortRanking(profiles, mode, profileId) {
  const me = profiles.find((profile) => profile.id === profileId);
  let rows = [...profiles];
  if (mode === "category" && me) rows = rows.filter((profile) => profile.category === me.category);
  if (mode === "team" && me) rows = rows.filter((profile) => profile.team === me.team);
  const key = mode === "duplicates" ? "duplicates" : mode === "near" ? "missing" : "owned";
  rows.sort((a, b) => {
    const av = profileStats(a)[key];
    const bv = profileStats(b)[key];
    return mode === "near" ? av - bv : bv - av;
  });
  return rows.slice(0, 20).map((profile) => ({ ...profile, stats: profileStats(profile) }));
}

function stickersPayload(profileId, album = {}) {
  return Object.entries(album)
    .map(([number, status]) => ({
      profile_id: profileId,
      sticker_number: Number(number),
      quantity: status === "duplicate" ? 2 : 1,
      status,
      updated_at: new Date().toISOString(),
    }))
    .filter((row) => Number.isInteger(row.sticker_number)
      && row.sticker_number >= 1
      && row.sticker_number <= TOTAL_STICKERS
      && ALLOWED_STATUS.has(row.status));
}

module.exports = {
  TOTAL_STICKERS,
  json,
  method,
  readBody,
  supabaseConfig,
  supabase,
  validateProfileInput,
  hashPin,
  verifyPin,
  publicProfile,
  albumFromRows,
  fetchProfilesWithAlbums,
  calculateMatches,
  sortRanking,
  stickersPayload,
};
