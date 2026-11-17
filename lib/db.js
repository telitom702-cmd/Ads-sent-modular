const { MongoClient } = require("mongodb");
const config = require("./config");

let clientPromise = null;
let initPromise = null;

async function ensureTtlIndex(links, seconds) {
  try {
    await links.createIndex({ createdAt: 1 }, { expireAfterSeconds: seconds });
  } catch (err) {
    // 85 / 86 = index exists with different options (e.g. TTL_DAYS was changed)
    if (err.code === 85 || err.code === 86) {
      await links.dropIndex("createdAt_1");
      await links.createIndex({ createdAt: 1 }, { expireAfterSeconds: seconds });
    } else {
      throw err;
    }
  }
}

async function getDb() {
  if (!config.MONGODB_URI) throw new Error("MONGODB_URI is not set");

  if (!clientPromise) {
    clientPromise = new MongoClient(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000
    }).connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }

  const client = await clientPromise;
  const db = client.db(config.DATABASE_NAME || "shortener");

  if (!initPromise) {
    initPromise = (async () => {
      const ttlDays = Math.max(1, Number(config.TTL_DAYS || 2));
      await ensureTtlIndex(db.collection("links"), ttlDays * 86400);
      await db.collection("apiKeys").createIndex({ key: 1 }, { unique: true });
      await db.collection("links").createIndex({ shortCode: 1 }, { unique: true });
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;

  return db;
}

module.exports = { getDb };
