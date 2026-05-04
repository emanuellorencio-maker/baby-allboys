const REQUIRED_GITHUB_ENV = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH"];

function ensureGithubEnv() {
  const missing = REQUIRED_GITHUB_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function assertAdminToken(token) {
  if (!process.env.ADMIN_TOKEN || String(token || "") !== String(process.env.ADMIN_TOKEN)) {
    const error = new Error("Token de administrador incorrecto.");
    error.statusCode = 401;
    throw error;
  }
}

function sanitizeText(value, max = 500) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function decodeContent(content, fallback) {
  if (!content) return fallback;
  return JSON.parse(Buffer.from(String(content).replace(/\n/g, ""), "base64").toString("utf8"));
}

function encodeContent(data) {
  return Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");
}

async function githubRequest(path, options = {}) {
  ensureGithubEnv();
  const method = options.method || "GET";
  const ref = method === "GET" ? `?ref=${encodeURIComponent(process.env.GITHUB_BRANCH)}` : "";
  const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}${ref}`, {
    ...options,
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "baby-allboys-pwa-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  if (response.status === 404 && method === "GET") return null;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `GitHub HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return body;
}

async function readJsonFile(path, fallback) {
  const file = await githubRequest(path, { method: "GET" });
  if (!file) return { data: fallback, sha: null };
  return { data: decodeContent(file.content, fallback), sha: file.sha };
}

async function writeJsonFile(path, data, sha, message) {
  const body = {
    message,
    content: encodeContent(data),
    branch: process.env.GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  return githubRequest(path, { method: "PUT", body: JSON.stringify(body) });
}

module.exports = {
  assertAdminToken,
  ensureGithubEnv,
  sanitizeText,
  readJsonFile,
  writeJsonFile,
};
