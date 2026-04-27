const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJsonLocal(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}`);
  }
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}`);
  }
  return response.text();
}

async function persistJson({ filePath, data, message }) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!repo || !token) {
    writeJsonLocal(filePath, data);
    return { mode: "local", filePath };
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath.replace(/\\/g, "/")}`;
  const current = await fetchJson(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "baby-allboys-prode",
      Accept: "application/vnd.github+json"
    }
  });

  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64");
  const result = await fetchJson(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "baby-allboys-prode",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content,
      sha: current.sha,
      branch
    })
  });

  return { mode: "github", commit: result.commit?.sha, filePath };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

module.exports = {
  readJson,
  writeJsonLocal,
  fetchJson,
  fetchText,
  persistJson,
  stripHtml,
  decodeEntities
};
