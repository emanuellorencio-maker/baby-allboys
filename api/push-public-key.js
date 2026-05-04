module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!publicKey) {
    return res.status(200).json({ ok: false, supported: false, error: "VAPID_PUBLIC_KEY no configurada." });
  }

  return res.status(200).json({ ok: true, publicKey });
};
