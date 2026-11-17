const { getDb } = require("../lib/db");
const mods = require("../lib/modules");

function notFound(res) {
  res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:system-ui;text-align:center;padding:60px 16px">' +
    '<h2>Link not found or expired</h2><p>Please go back and try again.</p></body>'
  );
}

module.exports = async (req, res) => {
  try {
    const code = String(req.query.code || "");
    if (!/^[A-Za-z0-9]{4,32}$/.test(code)) return notFound(res);

    const db = await getDb();
    const doc = await db.collection("links").findOne({ _id: code });
    if (!doc) return notFound(res);

    res.setHeader("Cache-Control", "no-store");

    const ctx = await mods.makeCtx(req, res, db, doc);
    if (await mods.handle(ctx)) return;

    // No module took the request (all disabled): send the visitor straight through.
    await ctx.inc("clicks");
    return ctx.redirect(doc.url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
