const crypto = require("crypto");
const { getDb } = require("../lib/db");
const config = require("../lib/config");
const { makeSession, requireAdmin, safeEqual } = require("../lib/auth");
const { getBaseUrl, parseUrl, createLink } = require("../lib/links");
const mods = require("../lib/modules");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.send(JSON.stringify(body));
}

// Simple in-memory login rate limit (per server instance): 10 failures / 15 min / IP
const attempts = new Map();
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}
function isLocked(ip) {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return a.count >= MAX_FAILS;
}
function addFail(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(ip, { count: 1, first: Date.now() });
  else a.count++;
}

function makeApiKey() {
  const bytes = crypto.randomBytes(20);
  let out = "";
  for (let i = 0; i < 20; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

module.exports = async (req, res) => {
  try {
    const action = String(req.query.action || "");

    if (req.method === "POST" && action === "login") {
      const ip = clientIp(req);
      if (isLocked(ip)) {
        return send(res, 429, { ok: false, message: "Too many attempts. Try again later." });
      }

      const { username, password } = req.body || {};

      const userOk = safeEqual(username || "", config.ADMIN_USERNAME);
      const passOk = safeEqual(password || "", config.ADMIN_PASSWORD);
      if (!(userOk && passOk)) {
        addFail(ip);
        return send(res, 401, { ok: false, message: "Invalid username or password" });
      }
      attempts.delete(ip);

      return send(res, 200, { ok: true, token: makeSession() });
    }

    if (!requireAdmin(req, res)) return;

    const db = await getDb();
    const apiKeys = db.collection("apiKeys");
    const links = db.collection("links");

    if (req.method === "GET" && action === "list") {
      const [keys, shortLinks] = await Promise.all([
        apiKeys.find({}, { projection: { key: 1, usageCount: 1, createdAt: 1, lastUsedAt: 1 } })
          .sort({ createdAt: -1 }).toArray(),
        links.find({}, { projection: { _id: 1, shortCode: 1, url: 1, createdAt: 1, clicks: 1, apiKeyId: 1 } })
          .sort({ createdAt: -1 }).toArray()
      ]);

      const keyMap = new Map(keys.map(k => [String(k._id), k.key]));
      const mappedLinks = shortLinks.map(x => ({
        id: x._id,
        shortCode: x.shortCode,
        originalUrl: x.url,
        shortenedUrl: `${getBaseUrl(req)}/${x.shortCode}`,
        createdAt: x.createdAt,
        clicks: x.clicks || 0,
        apiKey: keyMap.get(String(x.apiKeyId)) || ""
      }));

      return send(res, 200, {
        ok: true,
        apiKeys: keys.map(k => ({
          id: String(k._id),
          key: k.key,
          usageCount: k.usageCount || 0,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt || null
        })),
        links: mappedLinks
      });
    }

    if (req.method === "POST" && action === "create-key") {
      let key;
      for (let i = 0; i < 10; i++) {
        const candidate = makeApiKey();
        try {
          await apiKeys.insertOne({
            key: candidate,
            usageCount: 0,
            createdAt: new Date()
          });
          key = candidate;
          break;
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }

      if (!key) return send(res, 500, { ok: false, message: "Could not create API key" });
      return send(res, 201, { ok: true, key });
    }

    if (req.method === "POST" && action === "create-link") {
      const body = req.body || {};
      const parsed = parseUrl(body.url);
      if (parsed.error) return send(res, 400, { ok: false, message: parsed.error });

      const result = await createLink(db, {
        url: parsed.url,
        alias: body.alias ? String(body.alias) : "",
        apiKeyId: null
      });
      if (!result.code) return send(res, result.status, { ok: false, message: result.message });

      return send(res, 201, {
        ok: true,
        shortCode: result.code,
        shortenedUrl: `${getBaseUrl(req)}/${result.code}`
      });
    }

    if (req.method === "DELETE" && action === "delete-key") {
      const id = String(req.query.id || "");
      if (!id) return send(res, 400, { ok: false, message: "Missing key id" });

      let keyId;
      try {
        keyId = new (require("mongodb").ObjectId)(id);
      } catch {
        return send(res, 400, { ok: false, message: "Invalid key id" });
      }

      const deleted = await apiKeys.deleteOne({ _id: keyId });
      await links.deleteMany({ apiKeyId: keyId });

      return send(res, 200, {
        ok: true,
        deleted: deleted.deletedCount,
        deletedLinks: true
      });
    }

    if (req.method === "DELETE" && action === "delete-link") {
      const id = String(req.query.id || "");
      if (!id) return send(res, 400, { ok: false, message: "Missing link id" });

      const result = await links.deleteOne({ _id: id });
      return send(res, 200, { ok: true, deleted: result.deletedCount });
    }

    if (req.method === "GET" && action === "mod-list") {
      const rows = await db.collection("settings").find({}).toArray();
      return send(res, 200, { ok: true, modules: mods.describe(rows) });
    }

    if (req.method === "POST" && action === "mod-save") {
      const saved = await mods.save(db, String(req.query.m || ""), req.body || {});
      if (!saved) return send(res, 404, { ok: false, message: "Unknown module" });
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { ok: false, message: "Unknown action" });
  } catch (err) {
    console.error(err);
    return send(res, 500, { ok: false, message: "Server error" });
  }
};
