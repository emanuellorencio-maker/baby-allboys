const {
  json,
  method,
  readBody,
  supabaseConfig,
  supabase,
  verifyPin,
  publicProfile,
  albumFromRows,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;

  if (!supabaseConfig()) {
    return json(res, 200, { ok: true, mode: "demo" });
  }

  try {
    const body = await readBody(req);
    const nickname = encodeURIComponent(String(body.nickname || "").trim());
    const category = encodeURIComponent(String(body.category || "").trim());
    const team = encodeURIComponent(String(body.team || "").trim());
    const pin = String(body.pin || "").trim();

    if (!nickname || !category || !team || !/^\d{4}$/.test(pin)) {
      return json(res, 400, { ok: false, error: "Perfil no encontrado." });
    }

    const rows = await supabase(`profiles?nickname=eq.${nickname}&category=eq.${category}&team=eq.${team}&is_active=eq.true&select=id,nickname,category,team,pin_hash,is_active,created_at,updated_at&limit=1`, {
      method: "GET",
    });

    const profile = rows?.[0];
    if (!profile) return json(res, 404, { ok: false, error: "Perfil no encontrado." });
    if (!verifyPin(pin, profile.pin_hash)) return json(res, 401, { ok: false, error: "PIN incorrecto." });

    const stickers = await supabase(`stickers?profile_id=eq.${profile.id}&select=sticker_number,status,quantity`, { method: "GET" });
    return json(res, 200, { ok: true, mode: "real", profile: publicProfile(profile, albumFromRows(stickers)) });
  } catch (error) {
    console.error("intercambio/login", error);
    return json(res, 500, { ok: false, error: "No se pudo entrar, proba de nuevo." });
  }
};
