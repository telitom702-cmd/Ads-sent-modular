# Modules

Every file in `modules/` is a feature. Add a file = new feature. Delete or edit one file = only that feature changes.
Files starting with `_` are ignored (see `_example.js`).

| File | What it does |
|------|--------------|
| `bot-filter.js` | Bots get a plain preview page; per-IP rate limit |
| `pass.js` | After the ads once, other links open directly for N minutes |
| `ad-flow.js` | 1-3 step countdown pages with ads |

All settings (timers, ad code, pass minutes) are edited in the admin panel under "Modules".
A module that throws an error is skipped; the others keep working.
On Vercel keep `vercel.json` as is (`includeFiles` makes the folder available).
