const { readJsonFile, writeJsonFile, sanitizeText } = require("./_github");
const { recordMetric } = require("./_metrics");

const PUSH_PATH = "data/admin/push-subscriptions.json";

function emptyPush() {
  return { subscriptions: [] };
}

function normalizePush(data) {
  return {
    subscriptions: Array.isArray(data && data.subscriptions) ? data.subscriptions : [],
  };
}

function cleanSubscription(raw) {
  if (!raw || typeof raw !== "object") return null;
  const endpoint = sanitizeText(raw.endpoint, 600);
  const p256dh = sanitizeText(raw.keys && raw.keys.p256dh, 300);
  const auth = sanitizeText(raw.keys && raw.keys.auth, 160);
  if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo no permitido." });
  }

  try {
    const subscription = cleanSubscription(req.body && req.body.subscription);
    if (!subscription) {
      return res.status(400).json({ ok: false, error: "Suscripción inválida." });
    }

    const now = new Date().toISOString();
    const file = await readJsonFile(PUSH_PATH, emptyPush());
    const data = normalizePush(file.data);
    const index = data.subscriptions.findIndex((item) => item.endpoint === subscription.endpoint);

    if (index >= 0) {
      data.subscriptions[index] = { ...data.subscriptions[index], ...subscription, updated_at: now, valid: true };
    } else {
      data.subscriptions.push({ ...subscription, created_at: now, updated_at: now, valid: true });
    }

    await writeJsonFile(PUSH_PATH, data, file.sha, "actualiza suscripciones push");
    recordMetric({ event: "push_subscribe_success" }, "actualiza metricas por push").catch((error) => {
      console.warn("No se pudo trackear push", error.message);
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("push-subscribe", error);
    return res.status(error.statusCode || 500).json({ ok: false, error: error.message || "No se pudo guardar la suscripción." });
  }
};

module.exports._private = { cleanSubscription, normalizePush };
