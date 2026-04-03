# Deploying ThiThi v2 to Render.com

Two services are deployed separately:

| Service | Type | Directory |
|---|---|---|
| **thithi-server** | Web Service (Node.js) | `server/` |
| **thithi-client** | Static Site | `client/` |

Deploy the **server first** — the client needs the server URL before its first build.

---

## Prerequisites

Before touching Render, have these ready:

- [ ] MongoDB Atlas cluster (free M0 is fine) — connection string in hand
- [ ] Cloudinary account — `CLOUDINARY_URL` from the dashboard
- [ ] Google Cloud Console project — OAuth Client ID + Secret (if using Google login)
- [ ] Resend account — API key (for transactional emails)
- [ ] Your code pushed to a GitHub/GitLab repo connected to Render

---

## Step 1 — MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → create a free **M0** cluster
2. **Database Access** → Add a database user:
   - Username: e.g. `thithi-prod`
   - Password: generate a strong password (save it)
   - Role: **Read and write to any database**
3. **Network Access** → Add IP Address → `0.0.0.0/0`
   - Render IPs are not static, so you must allow all
4. **Connect** → Drivers → copy the connection string
   - Replace `<password>` with your DB user password
   - Replace `myFirstDatabase` with `thithi`
   - Final format: `mongodb+srv://thithi-prod:<password>@cluster0.xxxxx.mongodb.net/thithi`
5. Save this string — it becomes `MONGODB_URI`

---

## Step 2 — Deploy the Server

### 2a. Create the Web Service

1. [render.com/dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub/GitLab repo
3. Configure:

   | Field | Value |
   |---|---|
   | **Name** | `thithi-server` (or your choice) |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `node dist/index.js` |
   | **Instance Type** | Free (or Starter for always-on) |

4. Under **Advanced** → **Health Check Path**: `/health`

### 2b. Set Environment Variables

In the Render dashboard for the server service → **Environment** tab → add each variable:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Required |
| `MONGODB_URI` | `mongodb+srv://...` | From Step 1 |
| `SESSION_SECRET` | *(generate below)* | Min 32 chars |
| `BASE_URL` | `https://thithi-server.onrender.com` | Your server URL |
| `CLIENT_URL` | `https://thithi-client.onrender.com` | Your client URL |
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloud_name` | From Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | `thithi_products` | Your preset name |
| `CLOUDINARY_FOLDER` | `ecommerce/products` | |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | If using Google login |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | If using Google login |
| `GOOGLE_CALLBACK_URL` | `https://thithi-server.onrender.com/api/auth/google/callback` | Must match Google Console |
| `RESEND_API_KEY` | `re_xxxx` | From Resend dashboard |
| `FROM_EMAIL` | `ThiThi <noreply@yourdomain.com>` | Sender address |

**Generate `SESSION_SECRET`** — run this in your terminal and paste the output:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `PORT` — do **not** set this. Render injects it automatically.

### 2c. Deploy

Click **Create Web Service**. Render will:
1. Clone the repo
2. Run `npm install && npm run build` (TypeScript → `dist/`)
3. Start with `node dist/index.js`

Watch the **Logs** tab. A successful start looks like:
```
Server running on port 10000
Environment: production
Health check: https://thithi-server.onrender.com/health
```

Verify by visiting: `https://thithi-server.onrender.com/health`

Expected response:
```json
{ "status": "OK", "timestamp": "2026-04-03T..." }
```

---

## Step 3 — Configure Google OAuth (if used)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → your project → **APIs & Services** → **Credentials**
2. Click your OAuth 2.0 Client ID → **Edit**
3. Under **Authorized redirect URIs** → Add:
   ```
   https://thithi-server.onrender.com/api/auth/google/callback
   ```
4. Save. Changes take a few minutes to propagate.

---

## Step 4 — Deploy the Client

### 4a. Create the Static Site

1. Render dashboard → **New** → **Static Site**
2. Connect the same repo
3. Configure:

   | Field | Value |
   |---|---|
   | **Name** | `thithi-client` (or your choice) |
   | **Branch** | `main` |
   | **Root Directory** | `client` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

### 4b. Set Environment Variables

Static site env vars are injected at **build time** — they get baked into the JS bundle.

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://thithi-server.onrender.com` *(no trailing slash)* |
| `VITE_ENABLE_DEV_TOOLS` | `false` |

> Changing these requires a new deploy — the live site does not pick them up automatically.

### 4c. Deploy

Click **Create Static Site**. A successful build ends with:
```
✓ built in X.XXs
==> Uploading build...
```

Visit your client URL. The app should load and be able to call the server.

---

## Step 5 — Seed the Admin Account

The production database is empty. Create the admin user once by pointing the seed script at the Atlas URI:

```bash
cd server
MONGODB_URI="mongodb+srv://thithi-prod:<password>@cluster0.xxxxx.mongodb.net/thithi" npm run seed:admin
```

When prompted:
- **Email**: your admin email
- **Password**: minimum 12 characters (use something strong)
- First/last name: optional

---

## Step 6 — Update SERVER `BASE_URL` and `CLIENT_URL`

After both services are created you know the final URLs. Make sure the server env vars match exactly:

- `BASE_URL` = `https://thithi-server.onrender.com`
- `CLIENT_URL` = `https://thithi-client.onrender.com`

If you changed `CLIENT_URL`, click **Manual Deploy** on the server to restart with the new value.

---

## Step 7 — Smoke Test

Work through this checklist after deployment:

- [ ] `GET /health` returns `{ "status": "OK" }`
- [ ] Visit the client URL — homepage loads with products
- [ ] Register a new customer account (check email arrives via Resend)
- [ ] Verify email via the link in the email
- [ ] Log in as customer → add product to cart → checkout → place order
- [ ] Log in as admin (`thithi-server.onrender.com` pointing to admin login)
- [ ] Admin dashboard loads, order appears
- [ ] Upload a product image → image appears in Cloudinary and on the product
- [ ] Google OAuth login flow completes without `redirect_uri_mismatch` error

---

## Troubleshooting

### Build fails: `Cannot find module` or TypeScript error
Check that **Root Directory** is set to `server` (not the repo root). The build runs from inside that directory.

### Server starts but requests return 503
The free tier spins down after 15 min of inactivity. The first request after sleep takes ~30 seconds. Upgrade to **Starter** ($7/mo) for always-on.

### CORS error in the browser
`CLIENT_URL` on the server doesn't match the actual client origin. Check both the env var value and that it has no trailing slash.

### Google OAuth: `redirect_uri_mismatch`
The `GOOGLE_CALLBACK_URL` env var doesn't match what's registered in Google Cloud Console. They must be identical including `https://`.

### Cookies not set / session lost on reload
Ensure `NODE_ENV=production` is set on the server. This enables `secure: true` on cookies and the HTTPS redirect. Without it, the browser rejects the session cookie on an HTTPS page.

### Images not uploading
`CLOUDINARY_URL` must be in the format `cloudinary://api_key:api_secret@cloud_name`. Get it from Cloudinary dashboard → **Settings** → **API Keys** → copy the full URL.

### Emails not sending
If `RESEND_API_KEY` is not set, emails fall back to `console.log` (dev mode only — this won't work in production). Add the key and redeploy. Check Resend dashboard → **Logs** to confirm delivery.

### "VITE_API_BASE_URL must be set in production" on client
The env var was missing when the client built. Add it in the Render static site environment settings and trigger a new deploy.

---

## Redeployment

Both services auto-deploy on every push to the configured branch.

To trigger a manual redeploy: Render dashboard → service → **Manual Deploy** → **Deploy latest commit**.

To update environment variables without a code change: edit the value in Render → the service restarts automatically.

---

## Free Tier Limits

| Resource | Free Limit |
|---|---|
| Web Service | Spins down after 15 min inactivity |
| Static Site | 100 GB bandwidth/month |
| MongoDB Atlas M0 | 512 MB storage |
| Cloudinary | 25 GB storage + 25 GB bandwidth/month |

For a production store with real traffic, upgrade the Web Service to **Starter** ($7/mo) to avoid cold-start delays.
