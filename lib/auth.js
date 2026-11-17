const crypto = require("crypto");
const config = require("./config");

function hmac(value) {
  return crypto
    .createHmac("sha256", String(config.SESSION_SECRET))
    .update(value)
    .digest("hex");
}

// Timing-safe string comparison (hashes first so lengths always match)
function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function makeSession() {
  const payload = `${config.ADMIN_USERNAME}|${Date.now()}|${crypto.randomBytes(16).toString("hex")}`;
  return `${Buffer.from(payload).toString("base64url")}.${hmac(payload)}`;
}

function verifySession(token) {
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  // The signature is made over the decoded payload (same as makeSession)
  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = hmac(decoded);

  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const parts = decoded.split("|");
  if (parts.length < 3 || parts[0] !== String(config.ADMIN_USERNAME)) return false;

  const created = Number(parts[1]);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return Number.isFinite(created) && Date.now() - created < maxAge;
}

function getBearer(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function requireAdmin(req, res) {
  if (!verifySession(getBearer(req))) {
    res.status(401).json({ ok: false, message: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { makeSession, requireAdmin, verifySession, safeEqual };
