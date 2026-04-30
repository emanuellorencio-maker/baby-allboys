const {
  json,
  method,
  readBody,
  supabaseConfig,
  supabase,
  publicProfile,
  albumFromRows,
  stickersPayload,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!method(req, res, ["GET", "POST"])) return;

  if (!supabaseConfig()) {
    return json(res, 200, { ok: true, mode: "demo" });
  }

  try {
    const profileId = req.method === "GET" ? req.query.profileId : (await readBody(req)).profileId;
    if (!profileId) return json(res, 400, { ok: false, error: "Perfil no encontrado." });

    if (req.method === "GET") {
      const profiles = await supabase(`profiles?id=eq.${encodeURIComponent(profileId)}&is_active=eq.true&select=id,nickname,category,team,is_active,created_at,updated_at&limit=1`, { method: "GET" });
      if (!profiles?.[0]) return json(res, 404, { ok: false, error: "Perfil no encontrado." });
      const stickers = await supabase(`stickers?profile_id=eq.${encodeURIComponent(profileId)}&select=sticker_number,status,quantity`, { method: "GET" });
      return json(res, 200, { ok: true, mode: "real", profile: publicProfile(profiles[0], albumFromRows(stickers)) });
    }

    const body = await readBody(req);
    const rows = stickersPayload(profileId, body.album || {});
    await supabase(`stickers?profile_id=eq.${encodeURIComponent(profileId)}`, { method: "DELETE", prefer: "return=minimal" });
    if (rows.length) {
      await supabase("stickers", { method: "POST", body: JSON.stringify(rows), prefer: "return=minimal" });
    }
    await supabase(`profiles?id=eq.${encodeURIComponent(profileId)}`, {
      method: "PATCH",
      body: JSON.stringify({ updated_at: new Date().toISOString() }),
      prefer: "return=minimal",
    });
    return json(res, 200, { ok: true, mode: "real" });
  } catch (error) {
    console.error("intercambio/figus", error);
    return json(res, 500, { ok: false, error: "No se pudo guardar, proba de nuevo." });
  }
};
