const { assertAdminToken, readJsonFile, writeJsonFile, sanitizeText } = require("./_github");

const PUSH_PATH = "data/admin/push-subscriptions.json";

function normalizePush(data) {
  return {
    subscriptions: Array.isArray(data && data.subscriptions) ? data.subscriptions : [],
  };
}

function normalizeUrl(url) {
  const raw = sanitizeText(url || "/", 180);
  if (!raw || raw.startsWith("http://") || raw.startsWith("//")) return "/";
  if (raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (error) {
      return "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  try {
    assertAdminToken(req.body && req.body.token);
    const title = sanitizeText(req.body && req.body.title, 80) || "Baby All Boys";
    const body = sanitizeText(req.body && req.body.body, 180);
    if (!body) return res.status(400).json({ ok: false, error: "Mensaje obligatorio." });

    const webpush = require("web-push");
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
      return res.status(500).json({ ok: false, error: "Faltan variables VAPID." });
    }

    webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const file = await readJsonFile(PUSH_PATH, { subscriptions: [] });
    const data = normalizePush(file.data);
    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/maskable-192.png",
      data: { url: normalizeUrl(req.body && req.body.url) },
    });

    let enviadas = 0;
    let fallidas = 0;
    let removidas = 0;
    const vigentes = [];

    for (const subscription of data.subscriptions) {
      if (!subscription || subscription.valid === false) continue;
      try {
        await webpush.sendNotification(subscription, payload);
        enviadas += 1;
        vigentes.push(subscription);
      } catch (error) {
        fallidas += 1;
        if (error.statusCode === 404 || error.statusCode === 410) {
          removidas += 1;
        } else {
          vigentes.push(subscription);
        }
      }
    }

    if (removidas) {
      await writeJsonFile(PUSH_PATH, { subscriptions: vigentes }, file.sha, "limpia suscripciones push invalidas");
    }

    return res.status(200).json({ ok: true, enviadas, fallidas, removidas });
  } catch (error) {
    console.error("push-send", error);
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message || "No se pudo enviar la notificación." });
  }
};
