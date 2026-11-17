// Order 10: runs first. Bots get a plain preview page (no ads, no click counted).
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|curl|wget|python|httpx|axios|node-fetch|go-http|java\/|headless|phantom|puppeteer|playwright|selenium/;

const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

module.exports = {
  name: "bot-filter",
  title: "Bot filter",
  description: "Link-preview bots and scripts get a plain page. Also limits requests per IP.",
  order: 10,
  settings: [
    { key: "previewTitle", label: "Title shown in link previews", type: "text", default: "Your file is ready" },
    { key: "extraAgents", label: "Extra bot words in User-Agent (comma separated)", type: "text", default: "" },
    { key: "maxPerMinute", label: "Max requests per IP per minute (0 = off)", type: "number", default: 20 }
  ],
  init: (db) => db.collection("hits").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),

  async handle(ctx, c) {
    const ua = ctx.ua.toLowerCase();
    const extra = String(c.extraAgents || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!ua || BOT_RE.test(ua) || extra.some((x) => ua.includes(x))) {
      const t = esc(c.previewTitle);
      return ctx.html(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>${t}</title><meta property="og:title" content="${t}"><body>${t}</body>`);
    }
    const max = Number(c.maxPerMinute) || 0;
    if (max > 0) {
      const minute = Math.floor(Date.now() / 60000);
      const doc = await ctx.db.collection("hits").findOneAndUpdate(
        { _id: `${ctx.ipHash}:${minute}` },
        { $inc: { n: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + 120000) } },
        { upsert: true, returnDocument: "after" }
      );
      if (doc && doc.n > max) return ctx.html("Too many requests. Try again in a minute.", 429);
    }
    return false;
  }
};
