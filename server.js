// Server for Render (or any Node host). On Vercel this file is not used;
// Vercel runs the files in /api as serverless functions.
const path = require("path");
const express = require("express");
const config = require("./config");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "100kb" }));

const indexHandler = require("./api/index");
const adminHandler = require("./api/admin");
const goHandler = require("./api/go");

app.all("/api", indexHandler);
app.all("/api/admin", adminHandler);
app.all("/api/go", goHandler);

const publicDir = path.join(__dirname, "public");

app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));
app.use(express.static(publicDir));

// Short link: /abc123
app.get("/:code([A-Za-z0-9]{4,32})", (req, res) => {
  req.query.code = req.params.code;
  return goHandler(req, res);
});

app.use((req, res) => res.status(404).send("Not found"));

const port = Number(process.env.PORT || config.PORT || 3000);
app.listen(port, () => console.log(`Shortener running on port ${port}`));
