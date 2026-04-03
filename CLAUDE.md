# ThiThi v2 — Claude Code Context

## Project Overview

**ThiThi** (meaning "sweet" in Burmese) is a full-stack monorepo for selling homemade Burmese food online. Customers browse products, place orders, and pay via KBZPay. Sellers and admins manage products and verify payments through a dashboard.

---

Use below email and pw info to log in and see the UI as admin .
Email: thithiTest69@gmail.com
Password (min 8 chars): thithiTest69

## Monorepo Structure

```
ThiThi_v2/
├── client/          # React 18 / Vite 5 / TypeScript SPA (port 5174)
│   ├── client.md    # Full client documentation
│   └── CLAUDE.md    # Visual development guidelines (merged below)
├── server/          # Express 4 / MongoDB / Passport.js API (port 5000)
│   └── server.md    # Full server documentation + API reference
└── CLAUDE.md        # This file
```

`client/` and `server/` are independent npm packages — each has its own `package.json`, `node_modules`, and scripts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS 3 |
| **State** | TanStack React Query 5, React Context |
| **Routing** | React Router 6 |
| **Backend** | Express 4, TypeScript 5, Node.js |
| **Database** | MongoDB with Mongoose 7 |
| **Auth** | Passport.js (local + Google OAuth), express-session, connect-mongo |
| **Images** | Cloudinary (product images; payment proofs pending fix) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, bcryptjs (12 rounds) |
| **Testing** | Vitest + Playwright (client); Vitest + Supertest + mongodb-memory-server (server) |

---

## How to Start the Dev Environment

Two terminals are required:

**Terminal 1 — Server:**
```bash
cd server
npm run dev
# Starts on http://localhost:5000
```

**Terminal 2 — Client:**
```bash
cd client
npm run dev
# Starts on http://localhost:5174 (auto-opens browser)
```

**Prerequisites:**
- MongoDB running locally (or set `MONGODB_URI` to Atlas)
- `server/.env` with at minimum: `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_URL=http://localhost:5174`
- `client/.env` with: `VITE_API_BASE_URL=http://localhost:5000`

---

## Key Integration Points

### Session Cookies (Auth)

- Server sets an httpOnly `connect.sid` cookie on login
- Client must pass `credentials: 'include'` on every fetch — already done in `client/src/lib/api.ts`
- Server CORS must allow `http://localhost:5174` with `credentials: true` — configured in `server/src/index.ts`
- On app load, client calls `GET /api/auth/me` to restore session

### CORS

```
Client origin → http://localhost:5174 (dev) or CLIENT_URL env var (production)
Server CORS → allows CLIENT_URL with credentials
```

### Cloudinary Image Flow

1. Seller selects image → client POSTs `multipart/form-data` to `POST /api/uploads/image`
2. Server validates file (magic bytes, 2 MB max), uploads to Cloudinary
3. Server returns `{ url }` — client stores URL in product form
4. Product saved with `imageUrl` = Cloudinary secure URL

### KBZPay Payment Flow

1. Customer places order → `POST /api/orders` → order created with `payment.verified = false`
2. Customer makes KBZPay transfer manually
3. Customer uploads screenshot → `POST /api/orders/:id/payment` (multipart with `image` + `txLast6`)
4. Admin reviews order → `PATCH /api/orders/:id/verify` with `{ verified: true }`

---

## User Roles & Access Control

| Role | Access |
|---|---|
| `customer` | Browse products, place orders, view own orders, upload payment proof |
| `seller` | All customer permissions + manage own products, view all orders, update order status |
| `admin` | All seller permissions + manage any product, verify payments, access all orders |

Role is set at registration (default: `customer`). Changing roles requires direct DB edit or the seed script.

**Create admin:**
```bash
cd server && npm run seed:admin
```

---

## Environment Variables Quick Reference

### `server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/thithi
SESSION_SECRET=replace-with-32-char-minimum-secret
JWT_SECRET=replace-with-jwt-secret
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5174
DELIVERY_FEE=2000
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_UPLOAD_PRESET=thithi_products
CLOUDINARY_FOLDER=ecommerce/products
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_DEV_TOOLS=true
```

---

## Testing

### Client (Vitest + Playwright)

```bash
cd client
npm test                # Unit tests (watch mode)
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # Playwright with browser UI
```

- Unit tests: `src/**/*.test.ts` (hooks, validation)
- E2E tests: `e2e/*.spec.ts` (order modal, settings)
- Browsers: Chromium, Firefox, WebKit

### Server (Vitest + Supertest + mongodb-memory-server)

```bash
cd server
npm run test:run       # Integration tests (once)
npm run test:coverage  # Coverage report
```

- Test files co-located: `src/routes/*.test.ts`
- Uses in-memory MongoDB — no external database needed for tests

---

## Common Workflows

### Add a Product (Seller)

1. Login as seller → `/seller/products`
2. Click "Add Product" → `ProductModal` opens
3. Upload image → `POST /api/uploads/image` → Cloudinary URL stored
4. Fill name, description, price → `POST /api/products`
5. Product appears in store at `/`

### Place an Order (Customer)

1. Browse `/` → click "Add to Cart" on products
2. Cart sidebar → "Checkout" → `/checkout`
3. Fill phone + address → `POST /api/orders` → order created
4. Go to `/orders/:id` → upload KBZPay screenshot

### Upload Payment Proof (Customer)

1. `/orders/:id` → "Upload Payment Proof" section
2. Select JPEG/PNG screenshot + enter last 6 digits of transaction
3. Submit → `POST /api/orders/:id/payment`

### Verify Payment (Admin)

1. `/seller/orders` → click order
2. `OrderDetailModal` → "Verify Payment" button
3. `PATCH /api/orders/:id/verify` `{ verified: true }`

### Google OAuth

1. Click "Sign in with Google" on `/login`
2. Browser redirects to `GET /api/auth/google`
3. Google consent → callback to `GET /api/auth/google/callback`
4. Server creates/links account, sets session cookie
5. Browser redirected to `/products` (which redirects to `/`)

---

## Visual Development

### Design Resources

- **Design principles checklist:** `client/context/design-principles.md`
- **Brand style guide:** `client/context/style-guide.md`

When making any front-end (UI/UX) changes, always refer to these files.

### Brand Summary

- **Primary color:** Burmese Ruby `#DC2626` (red-600) — CTAs, primary buttons
- **Accent color:** Golden Saffron `#F59E0B` (amber-500) — hovers, accents
- **Font:** Inter (sans-serif)
- **Tone:** Warm, friendly, simple — "fresh homemade Mohinga, just like home"

### Quick Visual Check

IMMEDIATELY after implementing any front-end change:

1. **Identify what changed** — review the modified components/pages
2. **Navigate to affected pages** — use `mcp__playwright__browser_navigate`
3. **Verify design compliance** — compare against design-principles.md and style-guide.md
4. **Validate feature implementation** — ensure the change fulfills the request
5. **Check acceptance criteria** — review any provided context files
6. **Capture evidence** — take full-page screenshot at desktop viewport (1440px)
7. **Check for errors** — run `mcp__playwright__browser_console_messages`

### Comprehensive Design Review

Invoke the `@agent-design-review` subagent (defined in `client/.claude/agents/design-review-qa.md`) for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

---

## Coding Conventions

### Both sides
- TypeScript strict mode enabled
- No `any` types unless absolutely unavoidable
- Async/await (no raw Promise chains)

### Client
- Path alias `@/*` maps to `src/*` (configured in `vite.config.ts` + `tsconfig.json`)
- React Query for all server data — no local state for server state
- Zod schemas in `lib/validation.ts` for all form inputs
- Query keys defined in `lib/queryKeys.ts` using factory pattern

### Server
- ESLint + Prettier enforced — run `npm run format` before committing
- All route handlers use `express-validator` for input validation
- Route-level middleware composition: `isAuthenticated()`, `hasRole()`, `hasAnyRole()`
- Environment config centralised in `src/config/env.ts` — never read `process.env` directly elsewhere
- TypeScript compiled to `dist/` — never edit compiled output

### File naming
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Server utilities: `camelCase.ts`
- Test files: `*.test.ts` co-located with source

---

## Security Notes

| Feature | Implementation |
|---|---|
| Security headers | `helmet` (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | `authLimiter` (5/15min), `uploadLimiter` (10/hr), `apiLimiter` (100/15min) |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from all inputs |
| XSS | `express-validator` `.escape()` on user inputs |
| Password hashing | bcryptjs with 12 rounds |
| Session fixation | Session regenerated on login/register |
| File upload safety | Magic-byte validation (`file-type`), 2 MB limit, extension whitelist |
| HTTPS (prod) | Redirect enforced via `x-forwarded-proto` header check |
| Cookie security | `httpOnly: true`, `secure: true` in production, `sameSite: lax` |

---

## Known Issues

### 1. `POST /api/orders/:id/payment` — Broken Payment Proof Upload

**File:** `server/src/routes/orders.ts`

The payment proof upload handler references `req.file.filename` to build a local path, but multer is configured with **memory storage** (not disk storage), so `filename` is undefined. Payment proofs are not uploaded to Cloudinary as intended. This endpoint is currently non-functional.

---

## Detailed Documentation

- **Client internals + component catalog:** `client/client.md`
- **Server internals + full API reference:** `server/server.md`
