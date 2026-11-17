const { getDb } = require("../lib/db");
const { getBaseUrl, parseUrl, createLink } = require("../lib/links");

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.send(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { status: "error", message: "Method not allowed" });
    }

    const { api, url, format, alias } = req.query;

    if (!api) return send(res, 401, { status: "error", message: "API key is required" });
    if (!url) return send(res, 400, { status: "error", message: "URL is required" });

    const db = await getDb();
    const keyDoc = await db.collection("apiKeys").findOne({ key: String(api) });

    if (!keyDoc) {
      return send(res, 401, { status: "error", message: "Invalid API key" });
    }

    const parsed = parseUrl(url);
    if (parsed.error) {
      return send(res, 400, { status: "error", message: parsed.error });
    }

    const result = await createLink(db, {
      url: parsed.url,
      alias: alias ? String(alias) : "",
      apiKeyId: keyDoc._id
    });

    if (!result.code) {
      return send(res, result.status, { status: "error", message: result.message });
    }

    await db.collection("apiKeys").updateOne(
      { _id: keyDoc._id },
      { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
    );

    const shortenedUrl = `${getBaseUrl(req)}/${result.code}`;

    if (String(format).toLowerCase() === "text") {
      res.status(200).setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(shortenedUrl);
    }

    return send(res, 200, {
      status: "success",
      shortenedUrl,
      shortCode: result.code
    });
  } catch (err) {
    console.error(err);
    return send(res, 500, { status: "error", message: "Server error" });
  }
};
