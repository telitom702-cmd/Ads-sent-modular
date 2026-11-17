// Module loader. Every file in /modules is a plugin; this file never needs editing.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("./config");

let list = null;
const inited = new Set();

function load() {
  if (list) return list;
  list = [];
  const dir = path.join(__dirname, "..", "modules");
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js") || f.startsWith("_")) continue; // _file.js = ignored
    try {
      const m = require(path.join(dir, f));
      if (m && m.name) list.push(m);
    } catch (e) {
      console.error(`[module ${f}] failed to load:`, e.message);
    }
  }
  list.sort((a, b) => (a.order || 50) - (b.order || 50));
  return list;
}

function values(m, row) {
  const out = {};
  for (const s of m.settings || []) out[s.key] = s.default;
  Object.assign(out, (row && row.values) || {});
  out._enabled = !(row && row.enabled === false);
  return out;
}

function sign(...parts) {
  return crypto.createHmac("sha256", String(config.SESSION_SECRET))
    .update(parts.join("|")).digest("hex").slice(0, 32);
}

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

async function makeCtx(req, res, db, link) {
  const rows = await db.collection("settings").find({}).toArray();
  const map = new Map(rows.map((r) => [r._id, r]));
  const cookies = [];
  const secure = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim() === "https";
  const ip = clientIp(req);

  const ctx = {
    req, res, db, link, code: link._id, ip,
    ipHash: sign("ip", ip),
    ua: String(req.headers["user-agent"] || ""),
    query: req.query || {},
    sign, safeEq,
    cfg(name) {
      const m = load().find((x) => x.name === name);
      return m ? values(m, map.get(name)) : {};
    },
    cookie(name) {
      const hit = String(req.headers.cookie || "").split(";").map((s) => s.trim().split("="))
        .find((p) => p[0] === name);
      return hit ? hit.slice(1).join("=") : "";
    },
    setCookie(name, val, maxAgeSec) {
      cookies.push(`${name}=${val}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`);
    },
    inc(field) {
      return db.collection("links").updateOne({ _id: link._id }, { $inc: { [field]: 1 } });
    },
    html(body, status) {
      if (cookies.length) res.setHeader("Set-Cookie", cookies);
      res.status(status || 200).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(body);
      return true;
    },
    redirect(url) {
      if (cookies.length) res.setHeader("Set-Cookie", cookies);
      res.writeHead(302, { Location: url });
      res.end();
      return true;
    },
    async emit(event) {
      for (const m of load()) {
        const fn = m.on && m.on[event];
        const c = ctx.cfg(m.name);
        if (!fn || !c._enabled) continue;
        try { await fn(ctx, c); } catch (e) { console.error(`[${m.name}] ${event}:`, e.message); }
      }
    }
  };

  for (const m of load()) {
    if (m.init && !inited.has(m.name)) {
      inited.add(m.name);
      try { await m.init(db); } catch (e) { inited.delete(m.name); console.error(`[${m.name}] init:`, e.message); }
    }
  }
  return ctx;
}

// First module whose handle() returns true takes over the request.
async function handle(ctx) {
  for (const m of load()) {
    const c = ctx.cfg(m.name);
    if (!m.handle || !c._enabled) continue;
    try {
      if (await m.handle(ctx, c)) return true;
    } catch (e) {
      console.error(`[${m.name}] handle:`, e.message);
    }
  }
  return false;
}

// ---- admin panel helpers ----
function describe(rows) {
  const map = new Map(rows.map((r) => [r._id, r]));
  return load().map((m) => {
    const v = values(m, map.get(m.name));
    const enabled = v._enabled;
    delete v._enabled;
    return { name: m.name, title: m.title || m.name, description: m.description || "",
      enabled, settings: m.settings || [], values: v };
  });
}

function coerce(s, v) {
  if (s.type === "number") { const n = Number(v); return Number.isFinite(n) ? n : s.default; }
  if (s.type === "checkbox") return v === true || v === "true";
  if (s.type === "select") return (s.options || []).includes(v) ? v : s.default;
  return String(v == null ? "" : v).slice(0, 20000);
}

async function save(db, name, body) {
  const m = load().find((x) => x.name === name);
  if (!m) return false;
  const input = (body && body.values) || {};
  const vals = {};
  for (const s of m.settings || []) if (s.key in input) vals[s.key] = coerce(s, input[s.key]);
  await db.collection("settings").updateOne(
    { _id: name },
    { $set: { values: vals, enabled: !(body && body.enabled === false) } },
    { upsert: true }
  );
  return true;
}

module.exports = { makeCtx, handle, describe, save };
