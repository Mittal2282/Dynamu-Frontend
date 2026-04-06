# Dynamu — Frontend

> React 19 SPA for the Dynamu multi-restaurant platform. Serves three distinct user experiences: QR-based customer ordering, restaurant owner/staff dashboard, and superadmin restaurant management — all from a single app.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [User Experiences](#user-experiences)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Theme System](#theme-system)
- [Component Library](#component-library)
- [Real-time (Socket.io)](#real-time-socketio)
- [Order Status Flow](#order-status-flow)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | React Router 7 |
| State | Zustand 5 (with `persist` middleware) |
| HTTP | Axios 1.13 (two instances: customer + admin) |
| Real-time | Socket.io-client 4.8 |
| Styling | Tailwind CSS 4.2 + CSS custom properties |
| Spreadsheet | XLSX (menu bulk upload via CSV/XLSX) |

---

## User Experiences

### 1. Customer App (QR-gated)
Customers scan a table QR code and are routed to `/:qrCodeId/:tableNumber`. A session gate handles name entry, joining existing sessions, or starting new ones. Once inside, customers can browse the menu, chat with an AI assistant, manage their cart, place orders, and track them live.

### 2. Restaurant Dashboard (`/dashboard`)
Restaurant owners and staff manage the operation in real time: incoming orders across a Kanban-style board, live table map with session data, full menu CRUD with ingredient-level stock control, and revenue stats.

### 3. Superadmin (`/superadmin`)
Platform operators onboard new restaurants (restaurant details, owner account, multi-floor table setup, menu CSV import, QR code PDF generation).

---

## Getting Started

### Prerequisites

- Node.js 18+
- The [Dynamu Backend](../Dynamu-Backend/README.md) running on port 5001

### Installation

```bash
cd "Dynamu Frontend/Dynamu-Frontend"
npm install
```

### Development

```bash
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL
npm run dev          # Vite dev server with HMR, default port 5173
```

### Production Build

```bash
npm run build        # Outputs to dist/
npm run preview      # Serve the production build locally
```

---

## Environment Variables

Create a `.env` file in the project root:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | Backend API base URL (no trailing slash) |

### Example `.env`

```env
VITE_API_BASE_URL=http://localhost:5001
```

In production, set this to your deployed API domain, e.g. `https://api.dynamu.in`.

---

## Project Structure

```
src/
├── api/
│   ├── apiCaller.js        Universal GET/POST/PUT/PATCH/DELETE wrapper
│   ├── axiosInstance.js    Customer axios — injects x-session-token header
│   └── adminAxios.js       Admin axios — injects JWT + auto-refresh on 401
│
├── components/
│   ├── Header.jsx          Top nav (customer variant + legacy variant)
│   ├── AIChatDrawer.jsx    Full AI chat UI (voice, text, item cards)
│   ├── BottomNavigator.jsx Mobile bottom tab bar (customer app)
│   ├── CartDrawer.jsx      Slide-in cart with totals + checkout
│   ├── ProtectedRoute.jsx  Role-based route guard
│   │
│   ├── ui/
│   │   ├── Badge.jsx       VegBadge, CountBadge, status badges
│   │   ├── Button.jsx      primary/secondary/ghost/danger × sm/md/lg/xl
│   │   ├── Drawer.jsx      Mobile full-screen / desktop side-panel
│   │   ├── LazyImage.jsx   Lazy image with skeleton placeholder
│   │   ├── Modal.jsx       Generic overlay modal
│   │   ├── Spinner.jsx     Loading spinner
│   │   ├── Text.jsx        Semantic text with sizes/colors
│   │   └── Toast.jsx       Toast stack + ToastProvider + useToast()
│   │
│   ├── customer/
│   │   ├── CartControl.jsx   +/- quantity buttons (Zustand integration)
│   │   ├── MenuItemCard.jsx  Item card (image, veg badge, price, add button)
│   │   └── SessionGate.jsx   QR session state machine
│   │
│   └── dashboard/
│       ├── AddCategoryModal.jsx
│       ├── BulkUploadModal.jsx   CSV/XLSX import modal
│       └── ProductFormModal.jsx  Create / edit menu item
│
├── hooks/
│   ├── useLogout.js          POST logout + reset all stores + navigate /login
│   ├── useResetAuthStore.js
│   ├── useResetCartStore.js
│   └── useTheme.js           Apply CSS token vars from restaurantStore.themeNumber
│
├── layouts/
│   ├── CustomerLayout.jsx    QR customer app shell (socket, cart sync, AI chat)
│   ├── DashLayout.jsx        Restaurant admin sidebar + topbar + outlet
│   └── SuperAdminLayout.jsx  Superadmin shell
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── customer/
│   │   ├── CustomerHomePage.jsx    Hero + trending/chef-special/featured
│   │   ├── CustomerMenuPage.jsx    Full menu + category filter + price range
│   │   ├── CustomerCartPage.jsx    Cart review + checkout
│   │   └── CustomerOrdersPage.jsx  Live order tracking
│   ├── dashboard/
│   │   ├── OrdersPage.jsx          Kanban order board + status controls
│   │   ├── StatsPage.jsx           Revenue, count, avg order value
│   │   ├── TableStatusPage.jsx     Live table map + session management
│   │   ├── MenuManagePage.jsx      Menu CRUD (card grid + inline controls)
│   │   └── IngredientsPage.jsx     Ingredient stock management
│   └── superadmin/
│       ├── OnboardPage.jsx         3-step restaurant onboarding wizard
│       ├── RestaurantsPage.jsx     All restaurants list
│       └── RestaurantOrdersPage.jsx
│
├── Router/
│   ├── Routes.jsx            Full route tree
│   └── RouteProvider.jsx
│
├── services/
│   ├── adminService.js       All admin/dashboard API call functions
│   ├── customerService.js    All customer API call functions
│   ├── chatService.js        AI chat API functions
│   └── socketService.js      Socket.io connection management
│
├── store/
│   ├── authStore.js          Auth tokens, role, name (persisted)
│   ├── cartStore.js          Cart items (NOT persisted — server is truth)
│   ├── chatStore.js          Chat history + loading state (not persisted)
│   └── restaurantStore.js    Restaurant + table info (persisted except menu)
│
├── theme/
│   └── tokens.js             4 theme color systems (CSS var definitions)
│
├── utils/
│   ├── constants.js          App name, storage keys, chat chips, default theme
│   ├── endpoints.js          ALL API endpoint strings (single source of truth)
│   ├── formatters.js         currency, date, time, initials, truncate
│   └── helpers.js            debounce, clamp, slugify, sleep
│
├── App.jsx                   Root (CustomProvider → RouteProvider)
├── CustomProvider.jsx        Context wrappers (ToastProvider)
├── main.jsx                  ReactDOM.createRoot entry
└── index.css                 Global Tailwind + animations
```

---

## Routes

| Route | Layout | Component | Who |
|---|---|---|---|
| `/:qrCodeId/:tableNumber` | CustomerLayout | CustomerHomePage | Customer |
| `/:qrCodeId/:tableNumber/menu` | CustomerLayout | CustomerMenuPage | Customer |
| `/:qrCodeId/:tableNumber/cart` | CustomerLayout | CustomerCartPage | Customer |
| `/:qrCodeId/:tableNumber/orders` | CustomerLayout | CustomerOrdersPage | Customer |
| `/login` | None | LoginPage | Public |
| `/dashboard` | DashLayout | OrdersPage | owner, staff |
| `/dashboard/tables` | DashLayout | TableStatusPage | owner, staff |
| `/dashboard/menu` | DashLayout | MenuManagePage | owner, staff |
| `/dashboard/ingredients` | DashLayout | IngredientsPage | owner, staff |
| `/dashboard/stats` | DashLayout | StatsPage | owner, staff |
| `/superadmin` | SuperAdminLayout | RestaurantsPage | super_admin |
| `/superadmin/onboard` | SuperAdminLayout | OnboardPage | super_admin |
| `/superadmin/restaurants/:id/orders` | SuperAdminLayout | RestaurantOrdersPage | super_admin |

Route guards are handled by `ProtectedRoute.jsx` which reads `adminRole` from `authStore`.

---

## State Management

Four Zustand stores. Three are persisted to `localStorage`; cart is intentionally session-only.

### `authStore` — persisted as `AuthStore`

```js
// Customer
sessionToken        // QR session UUID
guestName           // Customer display name

// Admin
adminAccessToken    // JWT (15 min)
adminRefreshToken   // JWT (7 days)
adminRole           // 'super_admin' | 'restaurant_owner' | 'restaurant_staff'
adminName

// Actions
setSessionToken(), setGuestName()
setAdminTokens({ accessToken, refreshToken, role, name })
resetAuth()
```

### `restaurantStore` — persisted as `RestaurantStore` (except `menu`)

```js
// Restaurant branding (from session start)
id, name, slug, tagline
themeNumber         // 1–4, drives CSS vars
currency, currencySymbol
acceptsOnlinePayment
aiWelcomeMessage

// Table (from session start)
tableId, tableNumber, tableName
tableFloor          // Floor number (null for single-floor restaurants)
tableFloorName      // e.g. "Ground Floor", "Rooftop"

// Menu (session only, not persisted)
menu                // { categoryName: [MenuItems] }

// Actions
setRestaurant(data), setTable(data), setMenu(menu), reset()
```

### `cartStore` — NOT persisted

Server is the source of truth. Local state is a mirror synced via `syncCart()`.

```js
cart    // { [itemId]: { _id, name, price, qty, instruction } }

// Actions
add(item), remove(item), setCart(cart), setInstruction(id, text), clear()

// Derived hooks (use these in components, never read cart directly)
useCartItems()   // array of cart items
useCartCount()   // total quantity
useCartTotal()   // total price with discounts applied
```

### `chatStore` — NOT persisted

```js
messages    // [{ role: 'user' | 'ai', text, items, timestamp }]
loading
initialized

setMessages(), addMessage(), setLoading(), setInitialized(), reset()
```

---

## API Layer

All API calls go through `apiCaller` in `src/api/apiCaller.js`. Never call Axios directly in components — always use a service function.

```js
// Pattern
import { getDashTables } from '../../services/adminService';
const tables = await getDashTables();
```

Two Axios instances handle auth automatically:

- **`axiosInstance`** (customer) — injects `x-session-token` from `authStore.sessionToken`
- **`adminAxios`** (admin) — injects `Authorization: Bearer <adminAccessToken>`, auto-calls `/api/auth/refresh` on 401, then retries the original request

All API endpoint strings live exclusively in `src/utils/endpoints.js`. Always add new endpoints there first.

---

## Theme System

4 built-in themes defined in `src/theme/tokens.js`. The active theme is stored as `themeNumber` (1–4) in `restaurantStore` and set per-restaurant by the owner.

`useTheme()` applies the theme by writing CSS custom properties to `:root`:

| Token | Purpose |
|---|---|
| `--t-accent` | Primary brand color (buttons, active states) |
| `--t-accent2` | Secondary accent |
| `--t-bg` | Page background |
| `--t-surface` | Card / panel background |
| `--t-float` | Elevated element background |
| `--t-text` | Primary text |
| `--t-dim` | Muted / secondary text |
| `--t-line` | Borders and dividers |
| `--t-glow` | Ambient glow shadows |

| # | Theme | Accent | Background |
|---|---|---|---|
| 1 | Ember Dark | `#FF6B00` orange | `#0A0C10` |
| 2 | Gilded Night | `#D4AF37` gold | `#0D0B08` |
| 3 | Ocean Depth | `#3B82F6` blue | `#070B18` |
| 4 | Crimson Night | `#F43F5E` rose | `#0C080A` |

All dashboard UI uses the same token system — the entire product rebrands with a single theme number change.

---

## Component Library

### `ui/` — Headless / design-system primitives

| Component | Usage |
|---|---|
| `Button` | `variant`: primary/secondary/ghost/danger. `size`: sm/md/lg/xl |
| `Modal` | Generic overlay. Pass `isOpen`, `onClose`, `children` |
| `Drawer` | Full-screen mobile / side-panel desktop |
| `LazyImage` | Lazy-loaded image with skeleton placeholder + emoji fallback |
| `Toast` | `useToast()` hook returns `{ toast }`. Call `toast.success/error/info(msg)` |
| `Badge` | `VegBadge` (green/red dot), `CountBadge` (cart counter) |

### `customer/SessionGate.jsx` — State machine

Manages the QR entry flow with states:

```
checking → name_entry → join_or_create → waiting_approval → active
                     ↘ rejected
```

- In `name_entry` state, connects an anonymous socket to `table:{tableId}` room to receive `session:started` in real time (no polling).

### `dashboard/` — Admin modals

- `ProductFormModal` — Create/edit menu item with image upload (ImageKit), all fields, discount
- `AddCategoryModal` — Add new menu category
- `BulkUploadModal` — Paste or upload CSV/XLSX; preview before import

---

## Real-time (Socket.io)

Socket connections are managed in `src/services/socketService.js`. Three connection functions:

```js
connectAdminSocket(token)        // Admin dashboard — joins restaurant:{id} room
connectCustomerSocket(token)     // Customer session — joins session:{id} room
connectTableSocket(qrCodeId)     // Anonymous pre-session watcher — joins table:{id} room
```

Each returns the socket instance. Corresponding `disconnect*` functions clean up.

**Admin dashboard** (`TableStatusPage`, `OrdersPage`) listens for:
- `table:updated` — re-fetches table list
- `order:new`, `order:updated` — re-fetches order list

**Customer app** (`CustomerOrdersPage`) listens for:
- `order:updated` — updates order status in real time

**Session gate** (`SessionGate`) listens for:
- `session:started` — instantly transitions anonymous visitor from "name entry" to "join or create" screen when another customer starts a session at the same table

---

## Order Status Flow

```
pending → confirmed → preparing → ready → served → completed
                                                  ↘ cancelled
```

Each status has a full visual config in `src/constants/orderStatusConfig.js`:

**Restaurant dashboard — 3 Kanban columns:**

| Column | Statuses | CTA |
|---|---|---|
| Allocated | `pending`, `confirmed` | "Start Preparing" → `preparing` |
| In Progress | `preparing`, `ready` | "Mark Complete" → `served` |
| Completed | `served`, `completed`, `cancelled` | — |

A session card only moves to Completed when ALL orders in the session are terminal. Add-on orders (placed after the first) are tracked with `is_addon: true`.

**Customer view — 3 phases:**

| Phase | Statuses | Display |
|---|---|---|
| Waiting | `pending` | "Waiting for restaurant to accept" |
| Preparing | `confirmed`, `preparing`, `ready` | "Preparing your order" |
| Done | `served`, `completed` | "Order completed" |

Final bill button is enabled only when all orders are `served` / `completed` / `cancelled`.

---

## Deployment

### Static hosting (Vercel, Netlify, Cloudflare Pages)

```bash
npm run build
# Deploy the dist/ directory
```

Set `VITE_API_BASE_URL` as an environment variable in the platform dashboard.

For client-side routing to work, configure the platform to serve `index.html` for all routes:

**Vercel** — add a `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Environment per deployment

| Variable | Development | Production |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5001` | `https://api.yourdomain.com` |

### Production checklist

- [ ] `VITE_API_BASE_URL` points to your production API (HTTPS)
- [ ] Backend `FRONTEND_URL` is set to this app's domain (enables CORS)
- [ ] Backend `CUSTOMER_APP_BASE_URL` is set to this app's domain (used in QR codes)
- [ ] SPA fallback routing configured on your static host
- [ ] QR codes regenerated via superadmin panel if domain changed
