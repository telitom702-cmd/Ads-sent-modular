const crypto = require("crypto");
const config = require("./config");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const RESERVED = new Set(["admin", "api"]);
const ALIAS_RE = /^[A-Za-z0-9]{4,32}$/;

function makeCode(length) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Uses BASE_URL only if it is a real http(s) URL, otherwise the request host.
function getBaseUrl(req) {
  const configured = String(config.BASE_URL || "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[^\s/]+/i.test(configured) && configured !== "https://your-domain.com") {
    return configured;
  }
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return `${proto}://${req.headers.host}`;
}

// Returns { url } or { error }
function parseUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return { error: "URL is required" };
  if (raw.length > 2048) return { error: "URL is too long" };
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "Invalid URL" };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { error: "Only http/https URLs are allowed" };
  }
  return { url: parsed.toString() };
}

// Returns an error message, or null if the alias is fine
function checkAlias(alias) {
  if (!ALIAS_RE.test(alias)) {
    return "Alias must be 4-32 characters: letters and numbers only";
  }
  if (RESERVED.has(alias.toLowerCase())) return "This alias is reserved";
  return null;
}

// Creates a short link. Returns { code } or { status, message }.
async function createLink(db, { url, alias, apiKeyId }) {
  const links = db.collection("links");
  const doc = (code) => ({
    _id: code,
    shortCode: code,
    url,
    apiKeyId: apiKeyId || null,
    createdAt: new Date(),
    clicks: 0
  });

  alias = String(alias || "").trim();

  if (alias) {
    const problem = checkAlias(alias);
    if (problem) return { status: 400, message: problem };
    try {
      await links.insertOne(doc(alias));
      return { code: alias };
    } catch (err) {
      if (err.code === 11000) return { status: 409, message: "Alias already taken" };
      throw err;
    }
  }

  const length = Math.max(4, Number(config.SHORT_CODE_LENGTH || 6));
  for (let i = 0; i < 10; i++) {
    const code = makeCode(length);
    try {
      await links.insertOne(doc(code));
      return { code };
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  return { status: 500, message: "Could not create short URL" };
}

module.exports = { getBaseUrl, parseUrl, createLink, checkAlias };
