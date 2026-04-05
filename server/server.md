# ThiThi v2 — Server Documentation

## Project Overview

The server is an Express 4 REST API for a homemade Burmese food e-commerce platform. It uses MongoDB/Mongoose for data storage, Passport.js for session-based authentication (local + Google OAuth), Cloudinary for image hosting, and bcryptjs for password hashing.

| Technology | Version | Purpose |
|---|---|---|
| Express | 4.21.2 | HTTP framework |
| Mongoose | 7.8.7 | MongoDB ODM |
| Passport.js | 0.7.0 | Authentication middleware |
| bcryptjs | 2.4.3 | Password hashing (12 rounds) |
| express-session | 1.18.2 | Session management |
| connect-mongo | 6.0.0 | MongoDB session store |
| express-validator | 7.3.1 | Input validation |
| multer | 1.4.5-lts.1 | Multipart file uploads |
| cloudinary | 2.7.0 | Image hosting |
| helmet | 8.1.0 | Security headers |
| express-rate-limit | 8.2.1 | Rate limiting |
| express-mongo-sanitize | 2.2.0 | NoSQL injection prevention |
| cors | 2.8.5 | Cross-origin resource sharing |
| file-type | 21.2.0 | Magic-byte file validation |
| TypeScript | 5.9.2 | Type safety |

---

## Directory Structure

```
server/
├── src/
│   ├── index.ts                    # App entry: Express setup, middleware, route mounting
│   │
│   ├── config/
│   │   ├── env.ts                 # Reads and validates all env vars; exports config object
│   │   ├── mongo.ts               # Mongoose connection
│   │   ├── passport.ts            # Passport local + Google OAuth strategies
│   │   └── cloudinary.ts         # Cloudinary SDK initialisation
│   │
│   ├── models/
│   │   ├── User.ts               # User Mongoose schema + comparePassword method
│   │   ├── Product.ts            # Product schema
│   │   ├── Order.ts              # Order schema
│   │   └── BusinessSettings.ts   # Singleton business settings schema
│   │
│   ├── routes/
│   │   ├── auth.ts               # /api/auth/* endpoints
│   │   ├── products.ts           # /api/products/* endpoints
│   │   ├── orders.ts             # /api/orders/* endpoints
│   │   ├── uploads.ts            # /api/uploads/* endpoints
│   │   ├── settings.ts           # /api/settings/* endpoints
│   │   ├── products.test.ts      # Product route integration tests
│   │   ├── orders.test.ts        # Order route integration tests
│   │   ├── products.search.test.ts
│   │   └── orders.search.test.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts               # isAuthenticated, hasRole, hasAnyRole guards
│   │   ├── upload.ts             # Multer config (memory storage, size/type limits)
│   │   └── rateLimiter.ts        # authLimiter, uploadLimiter, apiLimiter
│   │
│   ├── types/
│   │   └── index.d.ts            # TypeScript interfaces shared across server
│   │
│   ├── utils/
│   │   ├── calcTotals.ts         # Calculates order subtotal, deliveryFee, total
│   │   ├── sessionHelpers.ts     # Session regeneration helper (prevents fixation)
│   │   └── searchValidator.ts    # Validates & sanitises search query strings
│   │
│   ├── scripts/
│   │   ├── README.md             # Guide for database inspection scripts
│   │   ├── checkOrders.ts        # Inspect orders in DB
│   │   ├── testOrdersEndpoint.ts # End-to-end order flow script
│   │   ├── fixMissingUserIds.ts  # Back-fill missing userId on orders
│   │   ├── fixOrphanedOrders.ts  # Remove orders with no valid user
│   │   └── checkPaymentProofs.ts # Audit payment proof URLs
│   │
│   ├── seed/
│   │   └── createAdmin.ts        # Creates initial admin user (run once)
│   │
│   └── test/
│       ├── app.ts               # Minimal Express app for integration tests
│       ├── setup.ts             # Vitest global setup (MongoDB Memory Server)
│       └── testUtils.ts         # Helpers: createUser, createProduct, loginAs...
│
├── dist/                          # Compiled JS output (git-ignored)
├── tsconfig.json
├── package.json
└── .env                           # Environment variables (git-ignored)
```

---

## Environment Variables

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP server port (default: 5000) |
| `NODE_ENV` | Yes | `development` | `development` or `production` |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/thithi` | MongoDB connection string |
| `SESSION_SECRET` | Yes | `change-me-32-chars-min` | express-session encryption secret (minimum 32 characters) |
| `BASE_URL` | Yes | `http://localhost:5000` | This server's public URL |
| `CLIENT_URL` | Yes | `http://localhost:5174` | Frontend URL — used in CORS & OAuth redirects |
| `DELIVERY_FEE` | No | `2000` | Fixed delivery fee in MMK (default: 2000) |
| `CLOUDINARY_URL` | Yes | `cloudinary://key:secret@cloud` | Full Cloudinary URL |
| `CLOUDINARY_UPLOAD_PRESET` | No | `thithi_products` | Unsigned upload preset name |
| `CLOUDINARY_FOLDER` | No | `ecommerce/products` | Folder path in Cloudinary |
| `GOOGLE_CLIENT_ID` | Yes* | `xxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | `GOCSPX-...` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Yes* | `http://localhost:5000/api/auth/google/callback` | OAuth callback URL |
| `RESEND_API_KEY` | No | `re_xxxx` | Resend email API key; if unset, emails log to console (dev fallback) |
| `FROM_EMAIL` | No | `ThiThi <noreply@resend.dev>` | Sender address for transactional emails |

\* Required if Google OAuth is enabled.

---

## Scripts

```bash
npm run dev              # Start with ts-node-dev (auto-restart on save)
npm run build            # Compile TypeScript → dist/
npm run start            # Run compiled server: node dist/index.js
npm run seed:admin       # Create initial admin user (prompts for email/password)

npm test                 # Vitest watch mode
npm run test:ui          # Vitest browser UI
npm run test:run         # Run tests once (CI mode)
npm run test:coverage    # Generate coverage report

npm run lint             # ESLint check
npm run format           # Prettier format all src/

# Database utility scripts (run with ts-node)
npm run check-orders         # Inspect order integrity
npm run test-orders          # Run order flow end-to-end
npm run fix-orders           # Back-fill missing userId fields
npm run fix-orphaned         # Remove orders with no valid user
npm run check-payment-proofs # Audit payment proof URLs
```

---

## Full API Reference

Base path for all API routes: **`/api`**

All successful responses include HTTP 200 or 201. Errors use 4xx/5xx with a JSON body.

**Standard error format:**
```json
{ "error": "Human-readable message" }
```

**Validation error format (400):**
```json
{
  "errors": [
    { "msg": "Password must be at least 12 characters", "param": "password", "location": "body" }
  ]
}
```

---

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Server health check |

**Response 200:**
```json
{ "status": "OK", "timestamp": "2025-01-01T00:00:00.000Z", "environment": "development" }
```

---

### Auth Routes — `/api/auth`

Rate limit on all auth endpoints: **10 requests per 15 minutes** per IP (failed requests only — `skipSuccessfulRequests: true`).

---

#### `POST /api/auth/register`

Create a new customer account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "profile": {
    "firstName": "Aye",
    "lastName": "Mya"
  }
}
```

**Validation rules:**
- `email`: valid email format, normalised to lowercase
- `password`: min 12 chars, must contain uppercase, lowercase, digit, special character
- `profile.firstName` / `profile.lastName`: optional strings
- `profile.phone`: optional, 7–15 digits

**Response 201:**
```json
{
  "message": "Account created! Please check your email to verify your account before logging in."
}
```

> No user object is returned — the account is not activated until the email verification link is clicked.

**Error codes:** `400` (validation), `409` (email already registered)

---

#### `POST /api/auth/login`

Authenticate with email and password. Creates a session.

**Request body:**
```json
{ "email": "user@example.com", "password": "SecurePass123!" }
```

**Validation rules:**
- `email`: valid email format
- `password`: non-empty string

**Response 200:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "64f...",
    "email": "user@example.com",
    "role": "customer",
    "profile": { "firstName": "Aye" }
  }
}
```

**Error codes:** `400` (validation), `401` (invalid credentials), `403` (email not verified)

**Side effects:** Session is regenerated to prevent session fixation.

---

#### `POST /api/auth/admin/login`

Alias for `/api/auth/login`. Kept for backward compatibility.

---

#### `POST /api/auth/logout`

Destroy the current session.

**Auth required:** Yes (must be logged in)

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

**Side effects:** Session destroyed in MongoDB store; `sessionId` cookie cleared.

---

#### `GET /api/auth/me`

Return the currently authenticated user.

**Auth required:** Yes

**Response 200:**
```json
{
  "user": {
    "id": "64f...",
    "email": "user@example.com",
    "role": "customer",
    "profile": { "firstName": "Aye", "lastName": "Mya", "avatar": null }
  }
}
```

> **Note:** `authProvider` is omitted from the current response despite being documented. It will be added in a future fix.

**Error codes:** `401` (not authenticated)

---

#### `GET /api/auth/google`

Initiate Google OAuth flow. Redirects browser to Google consent screen.

**Auth required:** No

---

#### `GET /api/auth/google`

Initiate Google OAuth flow. If the user is already authenticated, redirects to `/` on the client immediately (no new OAuth flow started).

**Auth required:** No

---

#### `GET /api/auth/google/callback`

OAuth callback from Google. After successful authentication:
1. Session is regenerated (prevents session fixation)
2. User is logged in via `req.login()`
3. Session is persisted to MongoDB
4. Browser is redirected to `/` on the client

**Auth required:** No

---

### Product Routes — `/api/products`

---

#### `GET /api/products`

List products with optional filtering, search, sorting, and pagination.

**Auth required:** No

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `available` | `boolean` | — | Filter by availability |
| `isBestSeller` | `boolean` | — | Filter best-sellers only |
| `search` | `string` | — | Case-insensitive search on product name (3–100 chars) |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `10` | Items per page (max 100) |
| `sortBy` | `string` | `createdAt` | Sort field: `name`, `price`, `available`, `createdAt` |
| `order` | `asc\|desc` | `desc` | Sort direction |

**Response 200:**
```json
{
  "products": [
    {
      "_id": "64f...",
      "name": "Mohinga",
      "description": "Traditional fish noodle soup",
      "price": 3500,
      "imageUrl": "https://res.cloudinary.com/.../mohinga.jpg",
      "images": ["https://res.cloudinary.com/.../mohinga-2.jpg"],
      "ingredients": ["fish paste", "lemongrass", "rice noodles"],
      "available": true,
      "isBestSeller": true,
      "createdBy": { "_id": "64f...", "email": "seller@example.com" },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

---

#### `GET /api/products/:id`

Get a single product by MongoDB ObjectId.

**Auth required:** No

**Response 200:** Single product object (same shape as above, `createdBy` populated).

**Error codes:** `404` (product not found)

---

#### `POST /api/products`

Create a new product.

**Auth required:** Yes — role: `seller` or `admin`

**Request body:**
```json
{
  "name": "Mohinga",
  "description": "Traditional fish noodle soup with lemongrass",
  "price": 3500,
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "images": ["https://res.cloudinary.com/.../image-2.jpg"],
  "ingredients": ["fish paste", "lemongrass", "rice noodles"],
  "available": true
}
```

**Validation rules:**
- `name`: 1–200 characters, required
- `description`: 1–2000 characters, required
- `price`: number, min 0.01, max 10,000,000
- `imageUrl`: valid URL format, required
- `images`: optional array, max 5 items (individual item content not validated — URLs are not format-checked)
- `ingredients`: optional array, max 30 items (individual item content not validated — no type or length check per item)

**Response 201:**
```json
{ "message": "Product created", "product": { ... } }
```

**Error codes:** `400` (validation), `401` (unauthenticated), `403` (insufficient role)

---

#### `PUT /api/products/:id`

Update an existing product. Partial updates are allowed (only send fields to change).

**Auth required:** Yes — role: `seller` (own products only) or `admin` (any)

**Request body:** Same fields as POST (all optional).

**Response 200:**
```json
{ "message": "Product updated", "product": { ... } }
```

**Error codes:** `400`, `401`, `403`, `404`

---

#### `DELETE /api/products/:id`

Delete a product.

**Auth required:** Yes — role: `seller` (own products only) or `admin` (any)

**Response 200:**
```json
{ "message": "Product deleted" }
```

**Error codes:** `401`, `403`, `404`

---

#### `PATCH /api/products/:id/best-seller`

Toggle the `isBestSeller` flag on a product.

**Auth required:** Yes — role: `seller` or `admin`

**Constraint:** A seller may have at most **3** best-seller products simultaneously. Attempting to mark a 4th returns `400`.

**Response 200:**
```json
{ "message": "Best seller status updated", "product": { ... } }
```

**Error codes:** `400` (limit exceeded), `401`, `403`, `404`

---

### Order Routes — `/api/orders`

---

#### `POST /api/orders`

Place a new order. Creates order with status `RECEIVED` and `payment.verified = false`.

**Auth required:** Yes (any authenticated user)

**Request body:**
```json
{
  "items": [
    { "productId": "64f...", "qty": 2 }
  ],
  "contactInfo": {
    "name": "Aye Mya",
    "phone": "09123456789",
    "address": "No. 5, Pyay Road, Yangon"
  },
  "notes": "Extra spicy please"
}
```

**Validation rules:**
- `items`: non-empty array; each item must have `productId` (valid ObjectId) and `qty` (integer 1–100)
- `contactInfo.name`: 1–100 characters, required
- `contactInfo.phone`: 7–15 digits
- `contactInfo.address`: 5–500 characters
- `notes`: optional string, max 1000 characters

**Side effects:** Server fetches current product prices (no client-provided prices trusted). Totals are calculated server-side using `calcTotals`.

**Response 201:**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "64f...",
    "userId": "64f...",
    "items": [
      { "productId": "64f...", "name": "Mohinga", "price": 3500, "qty": 2 }
    ],
    "status": "RECEIVED",
    "payment": { "method": "KBZPAY", "verified": false, "rejected": false },
    "totals": { "subtotal": 7000, "total": 9000 },
    "contactInfo": { "name": "Aye Mya", "phone": "09123456789", "address": "No. 5, Pyay Road" },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error codes:** `400` (validation / product not found / product unavailable), `401`

---

#### `GET /api/orders/my`

Get the authenticated customer's own orders.

**Auth required:** Yes (any authenticated user)

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `RECEIVED\|PREPARING\|DELIVERED` | — | Filter by status |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `10` | Items per page |
| `sortBy` | `string` | `createdAt` | Sort field |
| `order` | `asc\|desc` | `desc` | Sort direction |

**Response 200:**
```json
{
  "orders": [ ... ],
  "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1 }
}
```

---

#### `GET /api/orders`

Get all orders (for dashboard management).

**Auth required:** Yes — role: `admin` or `seller`

**Query parameters:** Same as `GET /api/orders/my` plus:

| Param | Type | Description |
|---|---|---|
| `search` | `string` | Search by order ID or customer phone number (3–100 chars) |

**Response 200:** Same pagination shape, orders include `userId` populated with user email.

---

#### `GET /api/orders/:id`

Get a single order by ID.

**Auth required:** Yes
- `customer`: can only view their own orders
- `seller` / `admin`: can view any order

**Response 200:** Single order object with `userId` populated.

**Error codes:** `401`, `403` (accessing another user's order), `404`

---

#### `PATCH /api/orders/:id/status`

Update an order's status.

**Auth required:** Yes — role: `admin` or `seller`

**Request body:**
```json
{ "status": "PREPARING" }
```

Valid values: `RECEIVED`, `PREPARING`, `DELIVERED`

**Response 200:**
```json
{ "message": "Order status updated successfully", "order": { ... } }
```

**Error codes:** `400` (invalid status), `401`, `403`, `404`

---

#### `POST /api/orders/:id/payment`

Upload a KBZPay payment proof screenshot to Cloudinary.

**Auth required:** Yes — customer (own orders only)

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `image` | File | Payment screenshot (JPEG, PNG, GIF, WebP; max 2 MB) |
| `txLast6` | string | Last 6 digits of the transaction reference (exactly 6 numeric digits) |

**File validation:** Magic-byte check via `file-type` library (not just MIME header).

**Upload flow:**
1. Multer buffers the file in memory (memory storage — no temp file on disk)
2. Magic-byte check runs on `req.file.buffer`
3. File is streamed directly to Cloudinary using `upload_stream` into the `ecommerce/payment_proofs` folder
4. Cloudinary returns a secure URL which is stored on `order.payment.proofUrl`
5. Any previous rejection flag (`payment.rejected`) is reset to `false`

**Side effects:** `payment.proofUrl`, `payment.txLast6` stored on order; `payment.verified` and `payment.rejected` both reset to `false`.

**Response 200:**
```json
{
  "message": "Payment proof uploaded successfully",
  "order": {
    "_id": "64f...",
    "payment": {
      "method": "KBZPAY",
      "proofUrl": "https://res.cloudinary.com/.../proof.jpg",
      "txLast6": "123456",
      "verified": false,
      "rejected": false
    }
  }
}
```

**Error codes:** `400` (no file / invalid type / missing or non-numeric txLast6), `401`, `403`, `404`, `500` (Cloudinary upload error)

---

#### `PATCH /api/orders/:id/verify`

Mark an order's payment as verified or unverified.

**Auth required:** Yes — role: `admin` only

**Request body:**
```json
{ "verified": true }
```

**Response 200:**
```json
{ "message": "Payment verification updated", "order": { ... } }
```

**Error codes:** `400`, `401`, `403`, `404`

---

### Upload Routes — `/api/uploads`

Rate limit: **20 uploads per hour** per IP.

---

#### `POST /api/uploads/image`

Upload an image directly to Cloudinary (used for product images).

**Auth required:** Yes — role: `seller` or `admin`

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `image` | File | Image file (JPEG, PNG, GIF, WebP; max 2 MB) |

**Response 201:**
```json
{
  "message": "Image uploaded",
  "url": "https://res.cloudinary.com/demo/image/upload/v.../product.jpg",
  "publicId": "ecommerce/products/abc123"
}
```

**Error codes:** `400` (no file / invalid type / too large), `401`, `403`, `500` (Cloudinary error)

---

### Settings Routes — `/api/settings`

---

#### `GET /api/settings/business`

Retrieve the store's public business contact and payment details.

**Auth required:** No (public endpoint)

**Response 200:**
```json
{
  "phoneNumber": "09123456789",
  "viberNumber": "09123456789",
  "contactEmail": "hello@thithi.com",
  "fbPageUrl": "https://www.facebook.com/thithi",
  "fbPageName": "ThiThi Homemade Food",
  "kbzPayNumber": "09123456789",
  "kbzPayName": "Aye Mya",
  "bankName": "KBZ Bank"
}
```

If no settings document exists yet, all fields are returned as empty strings (default object — no 404).

---

#### `PUT /api/settings/business`

Update business contact and payment settings. Uses `findOneAndUpdate` with `upsert: true` — creates the settings document if it does not yet exist.

**Auth required:** Yes — role: `seller` or `admin`

**Request body** (all fields optional):
```json
{
  "phoneNumber": "09123456789",
  "viberNumber": "09123456789",
  "contactEmail": "hello@thithi.com",
  "fbPageUrl": "https://www.facebook.com/thithi",
  "fbPageName": "ThiThi Homemade Food",
  "kbzPayNumber": "09123456789",
  "kbzPayName": "Aye Mya",
  "bankName": "KBZ Bank"
}
```

**Validation rules:**
- `phoneNumber`: optional, max 30 characters
- `viberNumber`: optional, max 30 characters
- `contactEmail`: optional, valid email format (normalised)
- `fbPageUrl`: optional, valid URL with protocol required
- `fbPageName`: optional, max 100 characters (HTML-escaped)
- `kbzPayNumber`: optional, max 30 characters
- `kbzPayName`: optional, max 100 characters (HTML-escaped)
- `bankName`: optional, max 100 characters (HTML-escaped)

> **Note:** Phone and KBZPay number fields accept any string up to 30 characters — no numeric or format validation is applied. See Security Audit section.

**Response 200:** Updated settings document (same shape as GET response).

**Error codes:** `400` (validation), `401`, `403`

---

## Database Models

### User (`src/models/User.ts`)

```typescript
{
  email:        String,   // unique, required, lowercase, trimmed
  password:     String,   // optional — absent for Google-only accounts
  role:         String,   // enum: 'customer' | 'seller' | 'admin'
  authProvider: String,   // enum: 'local' | 'google'
  googleId:     String,   // optional — Google OAuth user ID
  profile: {
    firstName:  String,
    lastName:   String,
    avatar:     String    // URL
  },
  isActive:     Boolean,  // default: true — deactivated accounts cannot login
  lastLogin:    Date,
  createdAt:    Date,     // added by timestamps: true
  updatedAt:    Date
}
```

**Methods:**
- `comparePassword(candidatePassword: string): Promise<boolean>` — bcrypt comparison
- `toJSON()` — strips `password` and `__v` from serialised output

**Hooks:**
- `pre('save')` — hashes `password` with bcryptjs (12 rounds) when modified

---

### Product (`src/models/Product.ts`)

```typescript
{
  name:         String,    // required, 1–200 chars, trimmed
  description:  String,    // required, 1–2000 chars
  price:        Number,    // required, min: 0
  imageUrl:     String,    // required — primary Cloudinary secure URL
  images:       [String],  // additional image URLs, default: [] (max 5 enforced at route layer)
  ingredients:  [String],  // ingredient list, default: [] (max 30 enforced at route layer)
  available:    Boolean,   // default: true
  isBestSeller: Boolean,   // default: false — max 3 per seller (enforced at route layer)
  createdBy:    ObjectId,  // ref: 'User', required
  createdAt:    Date,
  updatedAt:    Date
}
```

---

### Order (`src/models/Order.ts`)

```typescript
{
  userId: ObjectId,  // ref: 'User', required
  items: [{
    productId: ObjectId, // ref: 'Product'
    name:      String,   // snapshot at order time
    price:     Number,   // snapshot at order time, min: 0
    qty:       Number    // 1–100
  }],
  notes:  String,       // optional customer note, trimmed
  status: String,       // enum: 'RECEIVED' | 'PREPARING' | 'DELIVERED', default: 'RECEIVED'
  payment: {
    method:   String,   // enum: 'KBZPAY', default: 'KBZPAY'
    proofUrl: String,   // Cloudinary URL after upload
    txLast6:  String,   // 6-digit transaction reference
    verified: Boolean,  // default: false
    rejected: Boolean   // default: false — set by admin when rejecting proof
  },
  totals: {
    subtotal:    Number, // min: 0, required
    total:       Number  // min: 0, required
  },
  contactInfo: {
    name:    String,  // required, trimmed — customer name
    phone:   String,  // required, trimmed — 7–15 digits
    address: String   // required, trimmed — 5–500 chars
  },
  createdAt: Date,
  updatedAt: Date
}
```

> **Note:** `totals.deliveryFee` is not stored as a separate field on the schema — the delivery fee is factored into `totals.total` at calculation time.

---

### BusinessSettings (`src/models/BusinessSettings.ts`)

Singleton document — at most one record exists. Created on first `PUT /api/settings/business` call.

```typescript
{
  phoneNumber:  String,  // default: ''
  viberNumber:  String,  // default: ''
  contactEmail: String,  // default: ''
  fbPageUrl:    String,  // default: ''
  fbPageName:   String,  // default: ''
  kbzPayNumber: String,  // default: ''
  kbzPayName:   String,  // default: ''
  bankName:     String,  // default: ''
  createdAt:    Date,    // added by timestamps: true
  updatedAt:    Date
}
```

---

## Authentication

### Strategy

Session-based authentication via **express-session** + **connect-mongo** + **Passport.js**.

No JWTs are stored on the client. The session ID is sent as an httpOnly cookie.

### Session Configuration

| Setting | Value |
|---|---|
| Store | MongoDB (connect-mongo) |
| Cookie name | `sessionId` |
| `httpOnly` | `true` |
| `sameSite` | `lax` |
| `secure` | `false` (dev) / `true` (production) |
| Max age | 7 days |
| Resave | `false` |
| Save uninitialized | `false` |

### Passport Strategies

**Local strategy** (`passport-local`):
1. Find user by email (case-insensitive)
2. Check `isActive` flag
3. Call `user.comparePassword()` (bcrypt)
4. Prevent user enumeration (generic error if not found)

**Google OAuth strategy** (`passport-google-oauth20`):
1. Check if user with `googleId` already exists → log in
2. Check if user with same email exists → link Google to existing account
3. Otherwise → create new user with `authProvider: 'google'`

**Serialization:** `user._id` is stored in session.
**Deserialization:** User document fetched from DB on each request.

### Session Regeneration

`sessionHelpers.ts` provides a `regenerateSession()` helper that regenerates the session ID on login/register to prevent session fixation attacks.

---

## Middleware

### Auth Guards (`src/middleware/auth.ts`)

| Middleware | Description |
|---|---|
| `isAuthenticated()` | Returns 401 if `req.user` is absent |
| `isGuest()` | Returns 400 if user is already logged in |
| `hasRole(role)` | Returns 403 if `req.user.role !== role` |
| `hasAnyRole(...roles)` | Returns 403 if user's role is not in the list |
| `requireCustomer()` | Convenience alias — requires `customer` role |
| `requireAdminOrSeller()` | Convenience alias — requires `admin` or `seller` role |
| `requireAdmin()` | Convenience alias — requires `admin` role |
| `authenticateToken()` | Backward-compatibility alias for `isAuthenticated()` |
| `requireRole()` | Backward-compatibility alias for `hasRole()` |

These are composable — combine as needed in route definitions:
```typescript
router.post('/orders', isAuthenticated(), createOrder);
router.patch('/orders/:id/verify', isAuthenticated(), hasRole('admin'), verifyPayment);
```

### File Upload (`src/middleware/upload.ts`)

Multer configured with **memory storage**:
- `fieldname`: `image`
- Max file size: **2 MB**
- Max files: **1**
- Allowed extensions: `jpeg`, `jpg`, `png`, `gif`, `webp`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

After multer processes the file, route handlers use `file-type` for magic-byte validation on `req.file.buffer`. Files are never written to disk — they are streamed directly to Cloudinary from the in-memory buffer.

### Rate Limiters (`src/middleware/rateLimiter.ts`)

| Limiter | Limit | Window | Options | Applied to |
|---|---|---|---|---|
| `authLimiter` | 10 requests | 15 minutes | `skipSuccessfulRequests: true` (counts only failures) | Auth routes (register, login) |
| `uploadLimiter` | 20 requests | 1 hour | — | Upload routes + payment proof endpoint |
| `apiLimiter` | 300 requests | 15 minutes | — | All `/api/*` routes |

All limiters use `skip: () => NODE_ENV === 'test'` so they are bypassed in the test environment.

---

## Security Features

### HTTP Security Headers (Helmet)

- `Content-Security-Policy` — restricts resource origins; Cloudinary allowed for `img-src` and `connect-src`
- `Strict-Transport-Security` (HSTS) — 1 year, includeSubDomains, preload
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `X-Content-Type-Options: nosniff`
- `X-Powered-By` header removed

### HTTPS Enforcement (Production)

In `NODE_ENV=production`, requests without `x-forwarded-proto: https` are redirected to HTTPS.

### Input Sanitization

- **express-mongo-sanitize**: strips `$` and `.` from all request inputs, preventing NoSQL injection
- **express-validator `.escape()`**: HTML-encodes user inputs where appropriate
- **Search query validation**: regex input limited to 3–100 chars, sanitized before use

### Password Security

- bcryptjs with **12 salt rounds**
- Password never returned in API responses (`toJSON()` strips it)
- Generic error messages on failed login (no user enumeration)

### File Upload Security

1. Extension whitelist check (multer)
2. MIME type check from Content-Type header (multer)
3. **Magic-byte validation** via `file-type` (verifies actual file content against buffer)
4. 2 MB size cap
5. Single-file restriction
6. Memory storage only — no temp files written to disk

### Account Security

- `isActive` flag — deactivated accounts receive 403
- Session regeneration on login/register
- httpOnly session cookie (no JS access)
- sameSite: lax (CSRF protection)

### Middleware Order

CORS is applied **before** the rate limiter in `index.ts`. This ensures that CORS headers (`Access-Control-Allow-Origin`, etc.) are present on rate-limit error responses — without this, the browser would treat a 429 as a network error and the client would receive no useful information.

---

## Error Response Format

All error responses follow one of two shapes:

**Single error:**
```json
{ "error": "Human-readable description" }
```

**Validation errors (from express-validator):**
```json
{
  "errors": [
    {
      "msg": "Password must be at least 12 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

In production, 500 errors return a generic message. In development, the error message and stack trace may be included.

---

## Testing Infrastructure

### Unit / Integration Tests (Vitest + Supertest)

- Framework: Vitest
- HTTP testing: Supertest
- Database: `mongodb-memory-server` (in-memory MongoDB, no external DB needed for tests)
- Test app: `src/test/app.ts` — minimal Express instance without the session store
- Setup: `src/test/setup.ts` — spins up memory server, connects Mongoose, seeds minimal data

```bash
npm run test:run      # Single run
npm run test:coverage # Coverage report
```

**Test files** are co-located with route files:
- `src/routes/products.test.ts`
- `src/routes/orders.test.ts`
- `src/routes/products.search.test.ts`
- `src/routes/orders.search.test.ts`

---

## Deployment — Render (Web Service)

| Setting | Value |
|---|---|
| **Service type** | Web Service |
| **Build command** | `npm run build` |
| **Start command** | `node dist/index.js` |
| **Health check path** | `/health` |

### Required environment variables (set in Render dashboard)

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | *(leave blank — Render injects automatically)* |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Run `openssl rand -hex 32` to generate (40 chars) |
| `BASE_URL` | `https://your-server.onrender.com` |
| `CLIENT_URL` | `https://your-client.onrender.com` |
| `CLOUDINARY_URL` | Full URL from Cloudinary dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | Unsigned preset name |
| `CLOUDINARY_FOLDER` | `ecommerce/products` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-server.onrender.com/api/auth/google/callback` |
| `RESEND_API_KEY` | From Resend dashboard |

### MongoDB Atlas setup

1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a **database user** (separate from your Atlas login) with read/write access
3. Under **Network Access**, add `0.0.0.0/0` — Render IPs are not static
4. From **Connect → Drivers**, copy the connection string and replace `<password>`
5. Set as `MONGODB_URI` in Render

### Trust proxy

`app.set('trust proxy', 1)` is set in `src/index.ts`. This is required on Render because all traffic passes through Render's TLS-terminating load balancer. Without it:
- `req.ip` shows the load balancer's internal IP, breaking per-IP rate limiting
- `req.secure` is always `false`, breaking the HTTPS redirect and the `secure` cookie flag

### Graceful shutdown

The server handles `SIGTERM` and `SIGINT`. Render sends `SIGTERM` on every deploy and scale event. The handler stops accepting new connections via `server.close()`, then closes the MongoDB connection cleanly before exiting. A 10-second hard timeout forces exit if shutdown stalls.

### Post-deploy steps

1. **Seed admin account** — run once from a local machine pointing at the production DB:
   ```bash
   cd server
   MONGODB_URI=<atlas-uri> npm run seed:admin
   ```
2. **Update Google OAuth redirect URIs** — add `https://your-server.onrender.com/api/auth/google/callback` to Authorized Redirect URIs in [Google Cloud Console](https://console.cloud.google.com)

---

## Security Audit

Findings identified during codebase review. Severity levels: **High**, **Medium**, **Low**, **Info**.

### Fixed (High) — Rate limiter bypassed when `NODE_ENV=test`

**File:** `src/middleware/rateLimiter.ts`

**Finding:** All five rate limiters used `skip: () => process.env.NODE_ENV === 'test'`. If the server was accidentally started with `NODE_ENV=test` in production, every rate limit was silently disabled.

**Fix:** Skip predicate now requires both `NODE_ENV=test` **and** the absence of `RENDER` env var (which Render automatically injects into all deployed services). Rate limits are never bypassed on Render regardless of `NODE_ENV`.

---

### Fixed (High) — Raw verification/reset tokens logged to stdout

**File:** `src/services/emailService.ts`

**Finding:** The dev fallback path (used when `RESEND_API_KEY` is not set) logged the raw token to stdout with `console.log(\`Token: ${token}\`)`. If this path ran in production, tokens would appear in Render's log drain in plaintext, allowing anyone with log access to hijack accounts.

**Fix:** The bare `Token:` log line was removed from both `sendVerificationEmail` and `sendPasswordResetEmail`. The `Link:` line (which embeds the token in the full URL) is retained for local dev convenience.

---

### Fixed (Medium) — `SESSION_SECRET` not validated for minimum length

**File:** `src/config/env.ts`

**Finding:** The startup check only verified that `SESSION_SECRET` was present, not that it was long enough. A secret like `"abc"` would pass validation, making session tokens vulnerable to brute-force.

**Fix:** Added a length check that throws at startup if `SESSION_SECRET` is shorter than 32 characters.

---

### Fixed (Medium) — Health endpoint returned `NODE_ENV` in all environments

**File:** `src/index.ts`, lines 101–107

**Finding:** `/health` always returned `{ status, timestamp, environment }`. In production, the `environment` field reveals deployment configuration to anyone who can reach the endpoint.

**Fix:** `environment` is now omitted from the response when `NODE_ENV === 'production'`.

---

### Fixed (Low) — Admin seed script accepted 8-character passwords

**File:** `src/seed/createAdmin.ts`

**Finding:** The interactive prompt required a minimum of 8 characters, but the application's auth routes enforce a 12-character minimum. An admin account created via the seed script could have a shorter password than the policy required.

**Fix:** Minimum raised to 12 characters to match `src/routes/auth.ts`.

---

### Confirmed safe — Stack traces in error responses

**File:** `src/index.ts`, lines 150–167

**Finding reviewed:** The error handler correctly sends `stack` and `details` only when `NODE_ENV !== 'production'`. In production, only a sanitised message is returned. No change needed.

---

---

### Low-Medium — `auth.ts:195` reads `process.env.CLIENT_URL` directly

**File:** `src/routes/auth.ts`, line 195

**Finding:** The Google OAuth success callback reads `process.env.CLIENT_URL` directly instead of using the centralised `config.clientUrl` from `src/config/env.ts`. This bypasses the project's convention of never reading `process.env` outside of `env.ts`.

Additionally, the hardcoded fallback uses port `5173` (`http://localhost:5173/products`) instead of the correct dev port `5174`, meaning a misconfigured or missing `CLIENT_URL` env var would redirect to the wrong origin in development.

```typescript
// Current (problematic)
res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/products`);

// Should be
res.redirect(`${config.clientUrl}/products`);
```

**Impact:** If `CLIENT_URL` is unset, OAuth redirects land on the wrong port and the login flow silently fails for the user.

---

### Low — `env.ts` hardcoded fallback `SESSION_SECRET` in non-production

**File:** `src/config/env.ts`, line 8

**Finding:** The `sessionSecret` config value falls back to a hardcoded string (`'fallback_session_secret_change_this_in_production'`) in all environments. The guard that throws an error for a missing `SESSION_SECRET` only triggers in `production`. In `development` and `test`, sessions are silently secured with the known fallback string.

```typescript
sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret_change_this_in_production',
```

**Impact:** If a developer runs against a real (non-local) database without setting `SESSION_SECRET`, all sessions share a publicly known secret. Low risk locally; higher risk in staging environments that omit the env var.

---

### Info — `products.ts` — `images[]` and `ingredients[]` items not validated for content

**File:** `src/routes/products.ts`

**Finding:** The `images` and `ingredients` array fields are validated for array length (`max: 5` and `max: 30` respectively) but individual array items have no content validation. For `images`, items are not checked to be valid URLs. For `ingredients`, items are not checked for string type, maximum length, or disallowed characters.

```typescript
body('images').optional().isArray({ max: 5 })
body('ingredients').optional().isArray({ max: 30 })
```

**Impact:** Malformed data (e.g., very long strings, objects instead of strings) can be persisted to the database and may cause display issues on the client.

---

### Info — `settings.ts` — phone and KBZPay number fields have no format validation

**File:** `src/routes/settings.ts`

**Finding:** The `phoneNumber`, `viberNumber`, and `kbzPayNumber` fields only enforce a maximum length of 30 characters. No numeric format, regex, or Myanmar phone number pattern is applied. Any arbitrary string passes validation.

```typescript
body('phoneNumber').optional().trim().isLength({ max: 30 })
body('kbzPayNumber').optional().trim().isLength({ max: 30 })
```

**Impact:** Invalid values (e.g., letters, special characters) can be stored and displayed to customers on the checkout and contact pages, potentially causing confusion.

---

### Info — `/uploads` static route serves a directory that should always be empty

**File:** `src/index.ts`, line 99

**Finding:** The server mounts a static file handler for the `uploads/` directory:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
```

Because multer is configured with **memory storage**, no files are ever written to the `uploads/` directory — all uploads go directly to Cloudinary. The `uploads/` directory should always be empty, making this static route a dead endpoint. If a file were accidentally written there (e.g., by a misconfigured multer instance), it would be publicly accessible without authentication.

**Impact:** Negligible in current operation. Recommend removing the static route or documenting clearly that the directory must remain empty.
