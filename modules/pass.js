// Order 20: after one finished ad flow, the visitor skips ads for a while.
const scopeKey = (ctx, c) => (c.scope === "apikey" ? String(ctx.link.apiKeyId || "none") : "all");

module.exports = {
  name: "pass",
  title: "Pass",
  description: "After finishing the ads once, the visitor opens other links directly for the chosen time.",
  order: 20,
  settings: [
    { key: "minutes", label: "Pass duration (minutes)", type: "number", default: 60 },
    { key: "scope", label: "Pass works for", type: "select", options: ["all", "apikey"], default: "all" },
    { key: "useIp", label: "Also remember by IP (helps when cookies are lost)", type: "checkbox", default: true }
  ],
  init: (db) => db.collection("passes").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),

  async handle(ctx, c) {
    if (ctx.query.s) return false; // a step is being completed, not a fresh visit
    const sk = scopeKey(ctx, c);
    let ok = false;

    const cookie = ctx.cookie(`ps_${sk}`);
    if (cookie) {
      const [exp, sig] = cookie.split(".");
      ok = Number(exp) > Date.now() && ctx.safeEq(sig || "", ctx.sign("pass", sk, exp));
    }
    if (!ok && c.useIp) {
      const row = await ctx.db.collection("passes").findOne({ _id: `${ctx.ipHash}:${sk}` });
      ok = !!(row && row.expireAt > new Date());
    }
    if (!ok) return false;

    await ctx.inc("passClicks");
    return ctx.redirect(ctx.link.url);
  },

  on: {
    async complete(ctx, c) {
      const sk = scopeKey(ctx, c);
      const ms = Math.max(1, Number(c.minutes) || 60) * 60000;
      const exp = Date.now() + ms;
      ctx.setCookie(`ps_${sk}`, `${exp}.${ctx.sign("pass", sk, exp)}`, Math.round(ms / 1000));
      if (c.useIp) {
        await ctx.db.collection("passes").updateOne(
          { _id: `${ctx.ipHash}:${sk}` },
          { $set: { expireAt: new Date(exp) } },
          { upsert: true }
        );
      }
    }
  }
};
