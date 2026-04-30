const {
  json,
  method,
  supabaseConfig,
  fetchProfilesWithAlbums,
  calculateMatches,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;

  if (!supabaseConfig()) {
    return json(res, 200, { ok: true, mode: "demo", matches: [] });
  }

  try {
    const profileId = String(req.query.profileId || "");
    if (!profileId) return json(res, 400, { ok: false, error: "Perfil no encontrado." });
    const profiles = await fetchProfilesWithAlbums();
    const matches = calculateMatches(profiles, profileId);
    return json(res, 200, { ok: true, mode: "real", matches });
  } catch (error) {
    console.error("intercambio/matches", error);
    return json(res, 500, { ok: false, error: "No se pudieron cargar los cambios." });
  }
};
