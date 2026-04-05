# ThiThi v2 — Client Documentation

## Project Overview

The client is a React 18 single-page application for a homemade Burmese food e-commerce platform. It uses Vite 5 as the build tool, TypeScript 5 for type safety, Tailwind CSS 3 for styling, TanStack React Query 5 for server state, and React Router 6 for navigation.

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI framework |
| Vite | 5.0.8 | Build tool & dev server |
| TypeScript | 5.2.2 | Type safety |
| Tailwind CSS | 3.4.0 | Utility-first styling |
| TanStack React Query | 5.17.0 | Server state & caching |
| React Router | 6.21.0 | Client-side routing |
| Zod | 3.22.4 | Schema validation |
| Embla Carousel | 8.6.0 | Carousel (installed; `ProductDetailPage` uses a custom gallery with `useState`) |
| Lucide React | 0.303.0 | Icon library |

---

## Directory Structure

```
client/
├── public/                    # Static assets
├── src/
│   ├── main.tsx               # Entry point — wraps app in all providers
│   ├── App.tsx                # Route definitions (public, protected, dashboard)
│   ├── vite-env.d.ts         # Vite environment type declarations
│   │
│   ├── types/
│   │   └── index.ts          # All shared TypeScript interfaces & types
│   │
│   ├── lib/
│   │   ├── api.ts            # Type-safe API client (all fetch calls)
│   │   ├── config.ts         # Reads VITE_* env vars, exports config object
│   │   ├── queryKeys.ts      # React Query key factories (by domain)
│   │   └── validation.ts     # Zod schemas for all forms
│   │
│   ├── context/
│   │   ├── AuthContext.tsx   # Current user state + auth actions
│   │   ├── CartContext.tsx   # Cart state + actions (localStorage-backed)
│   │   └── ThemeContext.tsx  # Light/dark theme preference
│   │
│   ├── hooks/
│   │   ├── useApiError.ts          # Normalizes API error objects to strings
│   │   ├── useDebounce.ts          # Generic debounce hook
│   │   └── useBusinessSettings.ts  # React Query hook for fetching business settings
│   │
│   ├── components/
│   │   ├── Navigation.tsx           # Top nav: logo, cart icon, auth links
│   │   ├── ProductCard.tsx          # Product image, name, price, add-to-cart
│   │   ├── CartSidebar.tsx          # Slide-over cart with items list & checkout CTA
│   │   ├── CartItem.tsx             # Single cart entry with qty controls & remove
│   │   ├── OrderStatus.tsx          # Status badge (RECEIVED / PREPARING / DELIVERED)
│   │   ├── ProtectedRoute.tsx       # Route guard — redirects unauthenticated users
│   │   ├── GoogleSignInButton.tsx   # Google OAuth button
│   │   ├── ErrorBoundary.tsx        # React error boundary
│   │   ├── Button.tsx               # Base button component
│   │   ├── Input.tsx                # Base input component
│   │   ├── Textarea.tsx             # Base textarea component
│   │   ├── Card.tsx                 # Base card component
│   │   ├── Badge.tsx                # Status / label badge
│   │   ├── Toast.tsx                # Toast notification system
│   │   ├── ui/
│   │   │   └── carousel.tsx         # Embla-powered carousel
│   │   └── dashboard/               # Admin/seller-only UI pieces
│   │       ├── DashboardLayout.tsx  # Shell with sidebar + topbar
│   │       ├── DashboardTopBar.tsx  # Header inside dashboard
│   │       ├── Sidebar.tsx          # Navigation sidebar
│   │       ├── ProductModal.tsx     # Create/edit product form modal (uses MultiImageUpload)
│   │       ├── OrderDetailModal.tsx # Full order details modal
│   │       ├── ImageUpload.tsx      # Single drag-and-drop image uploader
│   │       ├── MultiImageUpload.tsx # Multi-image uploader (up to 5) with thumbnail picker
│   │       ├── Pagination.tsx       # Page controls
│   │       ├── BulkActionBar.tsx    # Bulk select + action bar
│   │       ├── SortableColumnHeader.tsx  # Clickable sort header
│   │       ├── ConfirmDialog.tsx    # Generic confirmation dialog
│   │       ├── BusinessSettingsTab.tsx   # Business info form
│   │       ├── ProfileTab.tsx       # User profile form (file present; not active in SettingsPage)
│   │       ├── NotificationsTab.tsx # Notification preferences (file present; not active in SettingsPage)
│   │       ├── IngredientsInput.tsx # Dynamic ingredients list input
│   │       └── index.ts             # Re-exports all dashboard components
│   │
│   ├── pages/
│   │   ├── HomePage.tsx             # Public product listing with carousel
│   │   ├── LoginPage.tsx            # Email/password + Google login
│   │   ├── RegisterPage.tsx         # New account registration
│   │   ├── ProductDetailPage.tsx    # Single product page
│   │   ├── CheckoutPage.tsx         # Order placement form
│   │   ├── MyOrdersPage.tsx         # Customer order history list
│   │   ├── OrderPage.tsx            # Single order detail + payment upload
│   │   ├── OrderReviewPage.tsx      # Order confirmation / review page
│   │   ├── PaymentUploadPage.tsx    # Standalone payment proof upload page
│   │   ├── SellerDashboard.tsx      # LEGACY — not routed, superseded by dashboard/
│   │   └── dashboard/
│   │       ├── OverviewPage.tsx     # Dashboard home with stats
│   │       ├── ProductsPage.tsx     # Product CRUD table
│   │       ├── OrdersPage.tsx       # Orders management table
│   │       ├── SettingsPage.tsx     # Business settings only (BusinessSettingsTab)
│   │       └── index.ts             # Re-exports all dashboard pages
│   │
│   ├── styles/
│   │   └── index.css              # Tailwind base, components, utilities
│   │
│   ├── test/                      # Test setup and utilities
│   ├── utils/                     # Shared utility functions
│   └── assets/                    # Images, logos, static media
│
├── e2e/                           # Playwright E2E tests
│   ├── order-detail-modal.spec.ts
│   └── settings.spec.ts
├── index.html                     # Vite HTML entry
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000` | Backend API base URL (no trailing slash) |
| `VITE_ENABLE_DEV_TOOLS` | No | `false` | Enables React Query DevTools overlay |

Create a `.env` file in `client/` by copying `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_DEV_TOOLS=true
```

In production, set `VITE_API_BASE_URL` to the deployed backend URL.

---

## Scripts

```bash
npm run dev        # Start Vite dev server on port 5174 (auto-opens browser)
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint on src/
npm test           # Run Vitest in watch mode
npm run test:ui    # Vitest with browser UI
npm run test:coverage  # Generate coverage report
npm run test:e2e   # Run Playwright E2E tests
npm run test:e2e:ui  # Playwright with browser UI
```

---

## Routing Map

All routes are defined in `src/App.tsx`.

| Path | Component | Auth Required | Role Required | Layout |
|---|---|---|---|---|
| `/` | `HomePage` | No | — | `AppLayout` |
| `/login` | `LoginPage` | No (guest only) | — | None |
| `/register` | `RegisterPage` | No (guest only) | — | None |
| `/products/:id` | `ProductDetailPage` | No | — | None |
| `/checkout` | `CheckoutPage` | Yes | customer | `AppLayout` |
| `/orders` | `MyOrdersPage` | Yes | customer | `AppLayout` |
| `/orders/:orderId` | `OrderPage` | Yes | customer (own) | `AppLayout` |
| `/seller` | `OverviewPage` | Yes | seller, admin | `DashboardLayout` |
| `/seller/products` | `ProductsPage` | Yes | seller, admin | `DashboardLayout` |
| `/seller/orders` | `OrdersPage` | Yes | seller, admin | `DashboardLayout` |
| `/seller/settings` | `SettingsPage` (business settings only) | Yes | seller, admin | `DashboardLayout` |

`ProtectedRoute` wraps protected paths and redirects to `/login` if unauthenticated.

---

## Context Providers

Providers are composed in `src/main.tsx` in this order (outermost first):
`QueryClientProvider` → `BrowserRouter` → `ThemeProvider` → `AuthProvider` → `CartProvider`

### AuthContext (`src/context/AuthContext.tsx`)

Manages session-based authentication state using React Query.

**State shape:**
```typescript
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;       // true while GET /api/auth/me is in-flight
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}
```

**Behaviour:**
- On mount, calls `GET /api/auth/me` (via React Query) to restore session
- `login()` calls `POST /api/auth/login`, then invalidates the `me` query
- `logout()` calls `POST /api/auth/logout`, clears user state
- `register()` calls `POST /api/auth/register`, then logs in automatically
- `hasRole()` checks `user.role` against one or more allowed roles

### CartContext (`src/context/CartContext.tsx`)

Client-side shopping cart persisted to `localStorage` under key `thithi_cart`.

**State shape:**
```typescript
interface CartContextValue {
  items: CartItem[];
  itemCount: number;          // total quantity across all items
  subtotal: number;           // sum of price * qty
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}
```

**Behaviour:**
- State is initialised from localStorage on mount
- Every state change writes back to localStorage
- `addItem()` increments qty if item already in cart
- `updateQuantity()` with qty ≤ 0 removes the item
- `clearCart()` is called automatically after a successful order

### ThemeContext (`src/context/ThemeContext.tsx`)

Toggles `dark` class on `<html>`. Preference is persisted to localStorage.

---

## API Client (`src/lib/api.ts`)

A single class instance (`api`) exported from `lib/api.ts`. All methods use `fetch` with `credentials: 'include'` so session cookies are sent automatically. The base URL comes from `config.apiBaseUrl` (derived from `VITE_API_BASE_URL`).

Errors are thrown as objects with shape `{ error: string }` or `{ errors: ValidationError[] }`.

### Auth

| Method | HTTP | Path | Description |
|---|---|---|---|
| `api.register(data)` | POST | `/api/auth/register` | Create account |
| `api.login(email, password)` | POST | `/api/auth/login` | Start session |
| `api.logout()` | POST | `/api/auth/logout` | Destroy session |
| `api.getMe()` | GET | `/api/auth/me` | Get current user |

### Products

| Method | HTTP | Path | Description |
|---|---|---|---|
| `api.getProducts(params)` | GET | `/api/products` | List with pagination & filters |
| `api.getProduct(id)` | GET | `/api/products/:id` | Single product |
| `api.createProduct(data)` | POST | `/api/products` | Create product (seller/admin) |
| `api.updateProduct(id, data)` | PUT | `/api/products/:id` | Update product |
| `api.deleteProduct(id)` | DELETE | `/api/products/:id` | Delete product |
| `api.toggleBestSeller(id)` | PATCH | `/api/products/:id/best-seller` | Toggle best-seller flag |
| `api.bulkDeleteProducts(ids)` | — | — | Delete multiple products |
| `api.bulkUpdateProducts(ids, data)` | — | — | Update multiple products |

### Orders

| Method | HTTP | Path | Description |
|---|---|---|---|
| `api.createOrder(data)` | POST | `/api/orders` | Place new order |
| `api.getMyOrders(params)` | GET | `/api/orders/my` | Customer's own orders |
| `api.getAllOrders(params)` | GET | `/api/orders` | All orders (seller/admin) |
| `api.getOrder(id)` | GET | `/api/orders/:id` | Single order |
| `api.updateOrderStatus(id, status)` | PATCH | `/api/orders/:id/status` | Change order status |
| `api.uploadPaymentProof(id, formData)` | POST | `/api/orders/:id/payment` | Upload payment screenshot |
| `api.verifyPayment(id, verified)` | PATCH | `/api/orders/:id/verify` | Mark payment verified (admin) |

### Uploads

| Method | HTTP | Path | Description |
|---|---|---|---|
| `api.uploadImage(formData)` | POST | `/api/uploads/image` | Upload image to Cloudinary |

### Settings

| Method | HTTP | Path | Description |
|---|---|---|---|
| `api.updateProfile(data)` | PUT | `/api/auth/profile` | Update user profile (name, avatar) |
| `api.getBusinessSettings()` | GET | `/api/auth/business` | Get seller business info |
| `api.updateBusinessSettings(data)` | PUT | `/api/auth/business` | Update seller business info |
| `api.getNotificationPreferences()` | GET | `/api/auth/notifications` | Get notification preferences |
| `api.updateNotificationPreferences(data)` | PUT | `/api/auth/notifications` | Update notification preferences |

---

## Type Definitions (`src/types/index.ts`)

### User

```typescript
type UserRole = 'customer' | 'seller' | 'admin';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}
```

### Product

```typescript
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];          // all product images (first is thumbnail by default)
  ingredients?: string[];     // optional list of ingredients
  available: boolean;
  isBestSeller: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Order

```typescript
type OrderStatus = 'RECEIVED' | 'PREPARING' | 'DELIVERED';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface PaymentInfo {
  method: 'KBZPAY';
  proofUrl?: string;
  txLast6?: string;
  verified: boolean;
  rejected: boolean;
}

interface OrderTotals {
  subtotal: number;
  total: number;
}

interface ContactInfo {
  name: string;
  phone: string;
  address: string;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  notes?: string;
  status: OrderStatus;
  payment: PaymentInfo;
  totals: OrderTotals;
  contactInfo: ContactInfo;
  createdAt: string;
  updatedAt: string;
}
```

### Cart (client-side only)

```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}
```

---

## Component Catalog

### Shared Components (`src/components/`)

| Component | Props summary | Purpose |
|---|---|---|
| `Navigation` | — | Top navigation bar: logo, cart icon, user menu |
| `ProductCard` | `product: Product` | Grid card with image, name, price, add-to-cart |
| `CartSidebar` | `isOpen`, `onClose` | Slide-over panel showing cart items + checkout |
| `CartItem` | `item: CartItem` | Single cart entry with qty +/- and remove |
| `OrderStatus` | `status: OrderStatus` | Coloured badge for order status |
| `ProtectedRoute` | `roles?: UserRole[]` | Redirects if user lacks required role |
| `GoogleSignInButton` | `onClick` | Styled Google OAuth button |
| `ErrorBoundary` | `fallback?` | Catches render errors |
| `Button` | `variant`, `size`, `loading` | Base button |
| `Input` | `label`, `error`, standard HTML attrs | Labelled input with error state |
| `Textarea` | `label`, `error` | Labelled textarea |
| `Card` | `className` | Container card |
| `Badge` | `variant` | Inline status chip |
| `Toast` | — | Toast notification trigger + container |
| `ui/carousel` | Embla props | Product image carousel |

### Dashboard Components (`src/components/dashboard/`)

| Component | Purpose |
|---|---|
| `DashboardLayout` | Full-page shell: sidebar + topbar + content slot |
| `DashboardTopBar` | Header with page title and user info |
| `Sidebar` | Left navigation with role-filtered links |
| `ProductModal` | Modal form for creating or editing a product |
| `OrderDetailModal` | Full order info + status update + payment verification |
| `ImageUpload` | Single file input with drag-and-drop and preview |
| `MultiImageUpload` | Multi-image uploader (up to 5) with thumbnail picker; used in `ProductModal` |
| `Pagination` | Previous / next / page number controls |
| `BulkActionBar` | Appears when rows selected; bulk delete/update actions |
| `SortableColumnHeader` | `<th>` that toggles sort direction on click |
| `ConfirmDialog` | Generic "Are you sure?" modal |
| `BusinessSettingsTab` | Form for seller business name, contact info, payment details |
| `ProfileTab` | Form for first name, last name, avatar — file present but not used in `SettingsPage` |
| `NotificationsTab` | Toggle switches for notification preferences — file present but not used in `SettingsPage` |
| `IngredientsInput` | Dynamic list input for product ingredients |

---

## Custom Hooks

### `useApiError` (`src/hooks/useApiError.ts`)

Normalises an unknown error thrown by the API client into a human-readable string.

```typescript
const message = useApiError(error);
// Returns: string suitable for displaying in UI
```

Handles: `Error` instances, objects with `{ error: string }`, objects with `{ errors: ValidationError[] }`, and unknown values.

### `useDebounce` (`src/hooks/useDebounce.ts`)

Generic debounce hook — delays updating a value until `delay` ms have passed without change.

```typescript
const debouncedSearch = useDebounce(searchTerm, 400);
```

Used in product search inputs to avoid firing an API request on every keystroke.

### `useBusinessSettings` (`src/hooks/useBusinessSettings.ts`)

React Query hook that fetches business settings from `GET /api/auth/business` and returns a typed `BusinessSettings` object with safe empty-string defaults. Query is cached for 5 minutes.

```typescript
const { settings, isLoading } = useBusinessSettings();
// settings: BusinessSettings — fields: phoneNumber, viberNumber, contactEmail,
//   fbPageUrl, fbPageName, kbzPayNumber, kbzPayName, bankName
```

Used by `ContactStrip`, `OrderPage`, and `OrderReviewPage` to display dynamic contact and payment info sourced from the database rather than hardcoded values.

---

## Authentication Flow

The client uses **session cookie–based authentication** — no JWTs are stored in the browser.

1. **On app load:** `AuthContext` calls `GET /api/auth/me` (React Query, `staleTime: 5 min`).
   - If the cookie is valid the server returns the user object → `user` state populated.
   - If not → `user` is `null`, no redirect happens at this point.

2. **Login:** `POST /api/auth/login` with `{ email, password }`.
   - Server regenerates session, sets `Set-Cookie: sessionId` (httpOnly, sameSite: lax/none).
   - Client receives `{ message, user }` and updates context.

3. **Google OAuth:**
   - Click → redirect to `GET /api/auth/google` on the server (full page navigation, not fetch).
   - Server handles OAuth callback, regenerates session, persists to MongoDB, then redirects browser to `/`.
   - On mount at `/`, `AuthContext` calls `GET /api/auth/me` to hydrate user state.

4. **Logout:** `POST /api/auth/logout` → session destroyed on server, cookie cleared.

5. **Protected routes:** `ProtectedRoute` reads from `AuthContext`. While `isLoading` is true, renders a spinner. If user is `null` after loading, redirects to `/login`.

**All fetch calls include `credentials: 'include'`** — required for cross-origin cookie delivery.

---

## Cart Persistence

- Storage key: `thithi_cart`
- Format: `JSON.stringify(CartItem[])`
- The cart survives page refreshes and browser restarts.
- `clearCart()` is called after a successful checkout to wipe the localStorage entry.
- The cart is NOT synced to the server — it is purely client-side.

---

## For the Server: What the Client Expects

### CORS

The client runs at **`http://localhost:5174`** in development. The server must allow this origin with `credentials: true`.

In production, the `CLIENT_URL` env var on the server must match the deployed frontend URL.

### Cookie Requirements

| Attribute | Value |
|---|---|
| `httpOnly` | `true` — client JS never reads the cookie |
| `sameSite` | `none` in production, `lax` in development |
| `secure` | `false` in dev, `true` in production |
| Name | `sessionId` (custom name set in `express-session` config) |

> **Why `SameSite=None` in production:** The client and server are on different `onrender.com` subdomains. `onrender.com` is in the browser's Public Suffix List, so these are treated as cross-site. `SameSite=Lax` cookies are not sent on cross-origin fetch/XHR requests, causing every `GET /api/auth/me` call to return 401. `SameSite=None; Secure` allows the cookie to be sent cross-origin.

### Expected JSON Response Shapes

**Success (single resource):**
```json
{ "message": "...", "user|product|order": { ... } }
```

**Success (list):**
```json
{
  "products|orders": [ ... ],
  "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 }
}
```

**Validation error (400):**
```json
{ "errors": [{ "msg": "...", "param": "...", "location": "body" }] }
```

**Auth / not found error (401, 403, 404, 500):**
```json
{ "error": "Human-readable message" }
```

### API Base URL

All requests are prefixed with `VITE_API_BASE_URL` (default: `http://localhost:5001`). No trailing slash.

Example: `GET http://localhost:5001/api/products?page=1&limit=12`

---

## Testing Infrastructure

### Unit / Integration Tests (Vitest)

- Config: `vite.config.ts` (vitest section)
- Test files: `*.test.ts` / `*.test.tsx` co-located with source
- Example: `src/hooks/useApiError.test.ts`, `src/lib/validation.test.ts`

```bash
npm test                # Watch mode
npm run test:coverage   # Coverage
```

### E2E Tests (Playwright)

- Config: `playwright.config.ts`
- Test files: `e2e/*.spec.ts`
- Browsers: Chromium, Firefox, WebKit
- Tests run against the running dev server

```bash
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # Playwright with browser UI
```

---

## Deployment — Render (Static Site)

| Setting | Value |
|---|---|
| **Service type** | Static Site |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

### Environment variables (set in Render dashboard before first build)

| Variable | Production value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-server.onrender.com` (no trailing slash) |
| `VITE_ENABLE_DEV_TOOLS` | `false` |

> **Important:** `VITE_*` variables are baked into the JavaScript bundle at **build time**. Changing them in the Render dashboard requires triggering a new build — the running site will not pick up changes automatically.

### SPA routing

React Router handles navigation client-side. Render's static file server only serves files that physically exist — a direct URL like `/orders/abc123` returns 404 unless a redirect rule is configured.

The file `public/_redirects` (committed to this repo) contains:
```
/*  /index.html  200
```
Vite copies this to `dist/` during build, instructing Render to serve `index.html` for all routes.

---

## Security Notes

- **Source maps disabled** — `vite.config.ts` sets `build.sourcemap: false`. The production bundle does not ship `.map` files.
- **API URL required in production** — `src/lib/config.ts` throws a configuration error at module load time if `VITE_API_BASE_URL` is not set during a production build. This prevents silent API calls to localhost.
- **No sensitive console.logs** — All `console.log` calls exposing order IDs, transaction data, file names, or the API base URL have been removed.
- **No tokens in localStorage** — Authentication uses HttpOnly session cookies via `credentials: 'include'`. No tokens are stored in localStorage or sessionStorage.
- **`.env` must not be committed** — Covered by `.gitignore`. If the file was committed historically, purge it with `git filter-repo --path client/.env --invert-paths` before pushing to a public repo.
