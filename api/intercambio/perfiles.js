const {
  json,
  method,
  readBody,
  supabaseConfig,
  supabase,
  validateProfileInput,
  hashPin,
  publicProfile,
  fetchProfilesWithAlbums,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!method(req, res, ["GET", "POST"])) return;

  if (!supabaseConfig()) {
    return json(res, 200, { ok: true, mode: "demo", profiles: [] });
  }

  try {
    if (req.method === "GET") {
      const profiles = await fetchProfilesWithAlbums();
      return json(res, 200, { ok: true, mode: "real", profiles });
    }

    const body = await readBody(req);
    const input = validateProfileInput(body);
    if (input.error) return json(res, 400, { ok: false, error: input.error });

    const inserted = await supabase("profiles", {
      method: "POST",
      body: JSON.stringify({
        nickname: input.nickname,
        category: input.category,
        team: input.team,
        pin_hash: hashPin(input.pin),
        is_active: true,
        updated_at: new Date().toISOString(),
      }),
    });

    return json(res, 200, { ok: true, mode: "real", profile: publicProfile(inserted[0], {}) });
  } catch (error) {
    console.error("intercambio/perfiles", error);
    if (error.detail?.code === "23505" || error.message?.includes("duplicate")) {
      return json(res, 409, { ok: false, error: "Ya existe un album con ese apodo, categoria y equipo." });
    }
    return json(res, 500, { ok: false, error: "No se pudo guardar, proba de nuevo." });
  }
};
