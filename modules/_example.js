// Template. Copy this file, rename it WITHOUT the leading underscore (e.g. my-feature.js)
// and it is loaded automatically. Delete the file to remove the feature.
module.exports = {
  name: "my-feature",              // unique name (also the settings key in the database)
  title: "My feature",             // title in the admin panel
  description: "What it does.",
  order: 50,                       // lower runs first (bot-filter 10, pass 20, ad-flow 90)

  // Shows up in the admin panel automatically. types: text, textarea, number, checkbox, select
  settings: [
    { key: "message", label: "Message", type: "text", default: "hello" }
  ],

  // Runs once per server start (create indexes here).
  // init: async (db) => {},

  // Runs on every visit. Return true if you answered the request (ctx.html / ctx.redirect),
  // return false to let the next module continue.
  async handle(ctx, cfg) {
    return false;
  },

  // Events: "complete" fires when a visitor finishes all ad steps.
  on: {
    async complete(ctx, cfg) {}
  }
};
