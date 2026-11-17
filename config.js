// Each value: server environment variable first, otherwise the value written here.
// Secrets are left empty on purpose. Set them in the server environment variables.
const config = {
  // --- Database ---
  MONGODB_URI: process.env.MONGODB_URI || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "shortener",

  // --- Admin login ---
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "12345678",

  // --- Session secret ---
  SESSION_SECRET: process.env.SESSION_SECRET || "dreamlinkin",

  // --- Service ---
  BASE_URL: process.env.BASE_URL || "dreamweburl",   // empty = auto-detect from request
  PORT: Number(process.env.PORT || 3000),

  // --- Link settings ---
  WAIT_SECONDS: Number(process.env.WAIT_SECONDS || 10),
  TTL_DAYS: Number(process.env.TTL_DAYS || 2),
  SHORT_CODE_LENGTH: Number(process.env.SHORT_CODE_LENGTH || 6),

  // --- Optional ad network HTML snippets ---
  AD_HEAD: process.env.AD_HEAD || "",
  AD_TOP: process.env.AD_TOP || "",
  AD_BOTTOM: process.env.AD_BOTTOM || ""
};

// Fail early if a required secret is missing
for (const key of ["MONGODB_URI", "ADMIN_PASSWORD", "SESSION_SECRET"]) {
  if (!config[key]) throw new Error(`Missing config value: ${key} (set it as an environment variable)`);
}

module.exports = config;
