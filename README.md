# Shortener Admin System

Link shortener with an admin panel. Works on **Vercel** and **Render**.

## Features

- MongoDB storage
- Admin panel at `/admin`
- Create / copy / delete 20-character API keys, with usage count
- Create short URLs through the API
- Copy short URLs and original URLs
- Click statistics, delete short URLs
- TTL cleanup of expired links
- Countdown / continue page with optional ad slots

## Configuration

`config.js` reads each value from a **server environment variable first**; if it is not set, the value written in `config.js` is used. Put secrets in the server environment variables only.

| Variable | Required | Default |
| --- | --- | --- |
| `MONGODB_URI` | yes (secret) | – |
| `DATABASE_NAME` | no | `shortener` |
| `ADMIN_USERNAME` | no | `admin` |
| `ADMIN_PASSWORD` | yes (secret) | – |
| `SESSION_SECRET` | yes (secret, long random string) | – |
| `BASE_URL` | no | auto-detected from request |
| `WAIT_SECONDS` | no | `10` |
| `TTL_DAYS` | no | `2` |
| `SHORT_CODE_LENGTH` | no | `6` |
| `AD_HEAD`, `AD_TOP`, `AD_BOTTOM` | no | empty |

## Deploy

**Vercel:** import the repo and add the environment variables. `vercel.json` handles routing; `server.js` is not used.

**Render:** create a Web Service, Build Command `npm install`, Start Command `npm start`, and add the environment variables. `server.js` serves the same handlers.

## API

```text
GET /api?api=API_KEY&url=ORIGINAL_URL
GET /api?api=API_KEY&url=ORIGINAL_URL&format=text
```

Example: `https://your-domain.com/api?api=YOUR_KEY&url=https://example.com`

## Admin

`https://your-domain.com/admin`

Deleting an API key also deletes all links created with it.
