const {
  json,
  method,
  supabaseConfig,
  fetchProfilesWithAlbums,
  sortRanking,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;

  if (!supabaseConfig()) {
    return json(res, 200, { ok: true, mode: "demo", ranking: [] });
  }

  try {
    const mode = String(req.query.mode || "advanced");
    const profileId = String(req.query.profileId || "");
    const profiles = await fetchProfilesWithAlbums();
    const ranking = sortRanking(profiles, mode, profileId);
    return json(res, 200, { ok: true, mode: "real", ranking });
  } catch (error) {
    console.error("intercambio/ranking", error);
    return json(res, 500, { ok: false, error: "No se pudo cargar el ranking." });
  }
};
