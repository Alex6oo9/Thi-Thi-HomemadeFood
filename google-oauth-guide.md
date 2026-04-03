# Google OAuth Implementation Guide

Based on the ThiThi v2 project stack: **Express + Passport.js + MongoDB + React + Vite**.

---

## Overview

Google OAuth lets users sign in with their Google account instead of creating a username/password. The server uses **Passport.js** with the `passport-google-oauth20` strategy. After Google authenticates the user, Passport creates or links a user record in MongoDB and sets an **httpOnly session cookie** — the same cookie used for all other authenticated requests.

---

## Prerequisites

### Server packages

```bash
npm install passport passport-google-oauth20 express-session connect-mongo
npm install -D @types/passport @types/passport-google-oauth20 @types/express-session
```

### Client packages

No extra packages needed — the Google sign-in button is a plain `<a>` tag pointing to the server's OAuth endpoint.

---

## Manual Steps

These are things **you must do yourself** — Claude Code cannot do them for you.

### 1. Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**
3. Give it a name (e.g., `my-app`) and click **Create**

### 2. Enable the Google+ API (or Google Identity)

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **Enable**

### 3. Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** (for apps open to any Google user)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Under **Scopes**, add: `email`, `profile`, `openid`
5. Save and continue through the remaining steps

### 4. Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:5001/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### 5. Add Credentials to `.env`

Open `server/.env` and add:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

In production, update `GOOGLE_CALLBACK_URL` to your live domain.

---

## Claude Code Steps

Use these prompts (in order) to have Claude Code implement each piece.

---

### Step 1 — Centralize environment config

> **Prompt:**
> "In `server/src/config/env.ts`, add `googleClientId`, `googleClientSecret`, and `googleCallbackUrl` fields, reading from `process.env`. Log a warning if any of the three are missing."

**What Claude will do:** Add the three fields to the env config object so nothing else reads `process.env` directly.

---

### Step 2 — Add `googleId` and `authProvider` to the User model

> **Prompt:**
> "Update the User model at `server/src/models/User.ts` to add:
> - `authProvider: { type: String, enum: ['local', 'google'], default: 'local' }`
> - `googleId: { type: String, unique: true, sparse: true }`
> - `profile: { firstName?: String, lastName?: String, avatar?: String }`
> Make `password` optional (not required) so OAuth users don't need one."

**What Claude will do:** Modify the Mongoose schema so Google users can be stored without a password.

---

### Step 3 — Configure the Passport Google strategy

> **Prompt:**
> "Create (or update) `server/src/config/passport.ts` to add a `GoogleStrategy` from `passport-google-oauth20`. Use the credentials from `config/env.ts`. In the verify callback:
> 1. Find a user by email.
> 2. If found, link the `googleId` if not already set, update `authProvider` to `'google'`, and update `lastLogin`.
> 3. If not found, create a new user with `authProvider: 'google'`, `googleId`, `email`, and profile info from the Google profile.
> 4. Return an error if no email is provided by Google or if `isActive` is false.
> Also add `serializeUser` (store `user.id`) and `deserializeUser` (look up by `id`) if not already present."

**What Claude will do:** Wire up the full OAuth verify callback with find-or-create logic.

---

### Step 4 — Add the two OAuth route handlers

> **Prompt:**
> "In `server/src/routes/auth.ts`, add two routes:
> 1. `GET /api/auth/google` — protected by `isGuest` middleware, initiates Passport OAuth with scopes `['profile', 'email']`.
> 2. `GET /api/auth/google/callback` — Passport callback; on success regenerate the session (to prevent session fixation), call `req.login()`, then redirect to `CLIENT_URL/products`; on failure redirect to `/login`."

**What Claude will do:** Add the two endpoints that Google redirects to and from.

---

### Step 5 — Initialize Passport in the Express app

> **Prompt:**
> "In `server/src/index.ts`, ensure `passport.initialize()` and `passport.session()` are called as middleware **after** the session middleware and **before** the routes. Import the passport config file to register all strategies."

**What Claude will do:** Hook Passport into the Express middleware chain in the right order.

---

### Step 6 — Add the Google sign-in button (client)

> **Prompt:**
> "Create `client/src/components/GoogleSignInButton.tsx`. It should render an `<a>` tag linking to `${config.apiBaseUrl}/api/auth/google`. Include a Google logo SVG and text that says 'Sign in with Google' (or 'Sign up with Google' when a `mode='signup'` prop is passed)."

**What Claude will do:** Create a reusable button component — no JS needed, just a browser navigation link.

---

### Step 7 — Add the button to Login and Register pages

> **Prompt:**
> "In `client/src/pages/LoginPage.tsx` and `RegisterPage.tsx`, import `GoogleSignInButton` and render it below the existing form with an 'OR' divider. Pass `mode='signup'` on the register page."

**What Claude will do:** Place the button in both auth pages.

---

### Step 8 — Verify session restoration on page load

> **Prompt:**
> "Confirm that `client/src/context/AuthContext.tsx` calls `GET /api/auth/me` on app load using React Query, and that all API calls in `client/src/lib/api.ts` pass `credentials: 'include'`. If either is missing, add it."

**What Claude will do:** Ensure the session cookie is sent with every request and the user's auth state is restored after a page refresh.

---

## File Map

| File | Role |
|---|---|
| `server/src/config/env.ts` | Centralizes all env vars including Google credentials |
| `server/src/config/passport.ts` | Registers LocalStrategy + GoogleStrategy; serialize/deserialize |
| `server/src/models/User.ts` | User schema with `googleId`, `authProvider`, `profile` |
| `server/src/routes/auth.ts` | `GET /api/auth/google` and `GET /api/auth/google/callback` |
| `server/src/middleware/auth.ts` | `isAuthenticated`, `isGuest`, `hasRole` helpers |
| `server/src/utils/sessionHelpers.ts` | `regenerateSession()` — prevents session fixation |
| `server/src/index.ts` | Session store config + `passport.initialize()` + `passport.session()` |
| `client/src/components/GoogleSignInButton.tsx` | `<a>` link to `/api/auth/google` |
| `client/src/pages/LoginPage.tsx` | Renders button below login form |
| `client/src/pages/RegisterPage.tsx` | Renders button below register form |
| `client/src/context/AuthContext.tsx` | Calls `GET /api/auth/me` on load to restore session |
| `client/src/lib/api.ts` | All fetches include `credentials: 'include'` |

---

## End-to-End Flow

```
1. User clicks "Sign in with Google"
   → Browser navigates to GET /api/auth/google

2. Passport redirects to Google's consent screen
   → User logs in and grants scopes (profile + email)

3. Google redirects to GET /api/auth/google/callback
   → Passport exchanges the code for tokens and receives user profile

4. GoogleStrategy verify callback runs:
   → Find user by email in MongoDB
   → If exists: link googleId (if missing), update lastLogin
   → If new: create user with authProvider='google', googleId, email, profile

5. Session regenerated (new ID → prevents session fixation)
   → req.login() called → Passport serializes user ID into session
   → connect.sid cookie set (httpOnly, sameSite: lax, 7-day TTL)

6. Server redirects browser to CLIENT_URL/products

7. React app loads → AuthContext fires GET /api/auth/me
   → Passport deserializes user from session
   → AuthContext stores user → UI renders authenticated state
```

---

## Security Checklist

- [ ] **Session fixation** — Call `regenerateSession()` before `req.login()` in the callback
- [ ] **httpOnly cookie** — Set `httpOnly: true` on the session cookie so JS cannot read it
- [ ] **Secure cookie in production** — Set `secure: true` when `NODE_ENV === 'production'`
- [ ] **sameSite: lax** — Prevents CSRF while allowing OAuth redirects
- [ ] **Session TTL** — Set a reasonable expiry (7 days is common); use `connect-mongo` to persist across restarts
- [ ] **Sparse + unique index on googleId** — `{ unique: true, sparse: true }` allows null but prevents duplicates
- [ ] **Optional password** — OAuth users must not be required to have a password field
- [ ] **`isActive` check** — Reject login if user account has been deactivated
- [ ] **`isGuest` middleware on OAuth route** — Prevent already-authenticated users from hitting `/api/auth/google`
- [ ] **Rate limiting on auth routes** — Limit to ~5 requests per 15 minutes to prevent abuse
- [ ] **CORS with credentials** — Server must allow `CLIENT_URL` with `credentials: true`; client must send `credentials: 'include'`
- [ ] **Redirect URI whitelisted in Google Console** — Exact match required; mismatches cause OAuth errors
- [ ] **Never commit `.env`** — Add `server/.env` to `.gitignore`

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | Callback URL doesn't match Google Console | Ensure `GOOGLE_CALLBACK_URL` exactly matches what's in Google Console |
| `401 Unauthorized` on `/api/auth/me` | Cookie not sent | Add `credentials: 'include'` to all client fetches |
| User created twice on re-login | Lookup by `googleId` instead of email | Always find-or-create by `googleId` first, then fall back to email |
| Session lost after server restart | No persistent session store | Use `connect-mongo` to store sessions in MongoDB |
| `passport.session()` error | Wrong middleware order | Session middleware must come before `passport.initialize()` |
