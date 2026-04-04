# ThiThi v2 — Manual Render Deployment Guide

> **No Blueprint. No Docker. Manual dashboard setup only.**
> Deploy server first — the client build needs the server URL before it runs.

---

## Overview

| Step | Service | Render Type |
|---|---|---|
| 1 | `server/` — Express API | Web Service |
| 2 | `client/` — React + Vite | Static Site |

---

## PART 1 — Deploy the Server (Web Service)

### Step 1 — Create the Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (`Thi-Thi-HomemadeFood`)
4. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `thithi-server` |
| **Region** | Singapore (SEA — closest to Myanmar) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |
| **Instance Type** | Free (upgrade to Starter $7/mo for always-on) |

> ⚠️ **Root Directory must be `server`, not `.` or blank.** If you leave it blank, Render runs from the repo root and `npm install` finds no `package.json`.

5. Scroll to **Advanced** → set **Health Check Path** to `/health`

---

### Step 2 — Set Server Environment Variables

In the Web Service page → **Environment** tab → add each variable one by one.

#### Required — server will not start without these

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/thithi` |
| `SESSION_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — paste the output |

> ⚠️ `SESSION_SECRET` must be at least 32 characters. The server throws on startup if it's shorter.

> ⚠️ Do **NOT** add `PORT`. Render injects it automatically. Setting it manually causes a port conflict.

#### Required for correct production behaviour

| Variable | Value |
|---|---|
| `BASE_URL` | `https://thithi-server.onrender.com` *(your exact server URL — no trailing slash)* |
| `CLIENT_URL` | `https://thithi-client.onrender.com` *(your exact client URL — no trailing slash)* |

> ⚠️ `CLIENT_URL` is used in two places: CORS `origin` header and OAuth redirect after Google login. If it's wrong, every cross-origin request fails and Google login lands on a blank page.

#### Required for image uploads (Cloudinary)

| Variable | Value |
|---|---|
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` — copy from Cloudinary dashboard → Settings → API Keys |
| `CLOUDINARY_UPLOAD_PRESET` | `thithi_products` |
| `CLOUDINARY_FOLDER` | `ecommerce/products` |

#### Required for Google OAuth (if used)

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → Credentials |
| `GOOGLE_CALLBACK_URL` | `https://thithi-server.onrender.com/api/auth/google/callback` |

> ⚠️ `GOOGLE_CALLBACK_URL` must exactly match the **Authorized Redirect URI** registered in Google Cloud Console — character for character, including `https://`.

#### Required for transactional emails (Resend)

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | From [resend.com](https://resend.com) dashboard |
| `FROM_EMAIL` | `ThiThi <noreply@yourdomain.com>` |

> If `RESEND_API_KEY` is not set, the server falls back to printing email links in the logs. This only works in development — in production, users will never receive verification or reset emails.

---

### Step 3 — Deploy and Verify the Server

1. Click **Create Web Service** — Render starts the first build
2. Watch the **Logs** tab — a successful start prints:
   ```
   Server running on port 10000
   Environment: production
   ```
3. Once live, open: `https://thithi-server.onrender.com/health`
4. Expected response:
   ```json
   { "status": "OK", "timestamp": "2026-04-04T..." }
   ```
   > If you see `{ "status": "OK", "timestamp": "...", "environment": "production" }` — that means `NODE_ENV` is not set correctly. The field should be absent in production.

**Do not proceed to the client until this health check passes.**

---

## PART 2 — Deploy the Client (Static Site)

### Step 4 — Create the Static Site

1. Render dashboard → **New +** → **Static Site**
2. Connect the same GitHub repo
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `thithi-client` |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

> ⚠️ **Root Directory must be `client`**. Same mistake as the server — blank means Render looks for the app at the repo root and the build fails.

> ⚠️ **Publish Directory is `dist`**, not `build` or `public`. Vite always outputs to `dist`.

---

### Step 5 — Set Client Environment Variables

> ⚠️ `VITE_*` variables are **baked into the JavaScript bundle at build time**. Setting them after the build has no effect — you must trigger a new deploy after any change.

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://thithi-server.onrender.com` *(no trailing slash)* |
| `VITE_ENABLE_DEV_TOOLS` | `false` |

> ⚠️ If `VITE_API_BASE_URL` is missing or wrong, the client throws a configuration error at load time and shows a blank page. The app is designed to fail loudly rather than silently call localhost in production.

---

### Step 6 — Deploy and Verify the Client

1. Click **Create Static Site** — Render builds and deploys
2. A successful build ends with:
   ```
   ✓ built in X.XXs
   ==> Uploading build...
   ==> Your site is live at https://thithi-client.onrender.com
   ```
3. Visit `https://thithi-client.onrender.com`
4. The homepage should load with products

---

## PART 3 — Post-Deploy Configuration

### Step 7 — Google OAuth Setup (if used)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → your project → **APIs & Services** → **Credentials**
2. Click your **OAuth 2.0 Client ID** → **Edit**
3. Under **Authorized redirect URIs** → click **Add URI** → paste:
   ```
   https://thithi-server.onrender.com/api/auth/google/callback
   ```
4. Under **Authorized JavaScript origins** → add:
   ```
   https://thithi-client.onrender.com
   ```
5. Click **Save** — takes up to 5 minutes to propagate

---

### Step 8 — Seed the Admin Account

Run this once from your local machine, pointed at the production database:

```bash
cd server
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/thithi" npm run seed:admin
```

When prompted:
- **Email:** your admin email address
- **Password:** minimum 12 characters
- **First/last name:** optional

---

## PART 4 — Smoke Test Checklist

Work through these in order after deployment. If one fails, fix it before continuing.

- [ ] `GET https://thithi-server.onrender.com/health` returns `{"status":"OK"}`
- [ ] `https://thithi-client.onrender.com` loads the homepage (products visible)
- [ ] No CORS errors in browser DevTools → Console or Network tab
- [ ] Register a new customer account → receive verification email
- [ ] Click the email verification link → account confirmed
- [ ] Log in as customer → session persists on page reload
- [ ] Add product to cart → proceed to checkout → place an order
- [ ] Admin login at `/login` with the seeded admin credentials
- [ ] Admin dashboard loads → the test order is visible
- [ ] Upload a product image → image appears (tests Cloudinary)
- [ ] Google OAuth login completes without `redirect_uri_mismatch` error

---

## PART 5 — Common Mistakes & Fixes

### ❌ Blank page on the client

**Cause A:** `VITE_API_BASE_URL` was not set before the build.
**Fix:** Add the env var in Render → trigger a **Manual Deploy** — the build must re-run.

**Cause B:** `VITE_API_BASE_URL` has a trailing slash (`https://server.onrender.com/`).
**Fix:** Remove the trailing slash. The client appends paths like `/api/auth/me` — a trailing slash produces `//api/auth/me`.

---

### ❌ CORS error on every API request

**Cause:** `CLIENT_URL` on the server does not exactly match the client's origin.
**Fix:** In Render server env vars, ensure `CLIENT_URL` is `https://thithi-client.onrender.com` with no trailing slash and the correct subdomain. Restart the server after changing it.

---

### ❌ Login succeeds but session is lost on next request / page reload

**Cause:** Session cookies are not being set correctly. This happens when:
- `NODE_ENV` is not `production` (disables `secure: true` on the cookie)
- The client is on `http://` instead of `https://` (browser rejects secure cookies)
- `CORS` is missing `credentials: true` (it has it — but double-check `CLIENT_URL`)

**Fix:** Confirm `NODE_ENV=production` is set. Both client and server must be on `https://`. Render provides HTTPS automatically on both Web Services and Static Sites.

---

### ❌ Google OAuth: `redirect_uri_mismatch`

**Cause:** The URI Render is calling (`GOOGLE_CALLBACK_URL`) is not in Google's allowed list.
**Fix:** Add the exact URI — `https://thithi-server.onrender.com/api/auth/google/callback` — to **Authorized redirect URIs** in Google Cloud Console. Wait 5 minutes and retry.

---

### ❌ Server build fails: `Cannot find module` or `tsc: command not found`

**Cause:** Root Directory is wrong — Render is running from the repo root instead of `server/`.
**Fix:** In the Web Service settings → **Settings** tab → **Root Directory** → set to `server`.

---

### ❌ Images not uploading

**Cause:** `CLOUDINARY_URL` is missing or malformed.
**Fix:** Format must be `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`. Get it from Cloudinary → Settings → API Keys → copy the full URL string.

---

### ❌ Emails not arriving

**Cause:** `RESEND_API_KEY` is not set. Server falls back to logging the link to stdout — which no one reads in production.
**Fix:** Add `RESEND_API_KEY` in Render env vars → Manual Deploy to restart.

---

### ❌ Changed an env var but nothing changed

**Cause:** Render restarts the server automatically after env var changes — **but the client static site does NOT rebuild**. Client env vars (`VITE_*`) are baked in at build time.
**Fix:** For server changes — wait 30 seconds for the restart. For client changes — go to the Static Site → **Manual Deploy** → **Deploy latest commit**.

---

### ❌ Free tier cold start (30-second delay on first request)

**Cause:** Free Web Services spin down after 15 minutes of inactivity. The first request after sleep wakes the server.
**Fix:** Upgrade to **Starter ($7/mo)** for always-on. Or accept the cold start and warn users.

---

## Final Checklist — Do These in Order

```
BEFORE YOU START
─────────────────────────────────────────────────────
[ ] MongoDB Atlas cluster created, connection string ready
[ ] Cloudinary account ready, CLOUDINARY_URL copied
[ ] Google Cloud project ready (if using Google login)
[ ] Resend account ready, API key copied
[ ] Code pushed to GitHub (main branch)

DEPLOY SERVER
─────────────────────────────────────────────────────
[ ] New Web Service created
[ ] Root Directory = server
[ ] Build Command = npm install && npm run build
[ ] Start Command = node dist/index.js
[ ] Health Check Path = /health
[ ] NODE_ENV = production
[ ] SESSION_SECRET set (32+ chars)
[ ] MONGODB_URI set (Atlas connection string)
[ ] BASE_URL set (https://thithi-server.onrender.com)
[ ] CLIENT_URL set (will update after client deploys if unsure)
[ ] Cloudinary vars set
[ ] Google OAuth vars set (if using Google login)
[ ] Resend vars set
[ ] PORT is NOT set
[ ] Health check passes: GET /health returns {"status":"OK"}

DEPLOY CLIENT
─────────────────────────────────────────────────────
[ ] New Static Site created
[ ] Root Directory = client
[ ] Build Command = npm install && npm run build
[ ] Publish Directory = dist
[ ] VITE_API_BASE_URL = https://thithi-server.onrender.com (no trailing slash)
[ ] VITE_ENABLE_DEV_TOOLS = false
[ ] Homepage loads at client URL

POST-DEPLOY
─────────────────────────────────────────────────────
[ ] Update server CLIENT_URL if the client URL differed from expected
[ ] Add Google OAuth redirect URI in Google Cloud Console
[ ] Run seed:admin to create the admin account
[ ] Complete the smoke test checklist (Part 4 above)
```
