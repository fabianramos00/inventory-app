# GestiónStock — Project Context

Inventory management SPA for an ironmongery/hardware store ("ferretería"). Built in TypeScript React. All UI text is in **Spanish**.

## Tech Stack

| Layer | Tool |
|---|---|
| Bundler | Vite v7 |
| UI Framework | React 19 + TypeScript |
| Routing | React Router DOM v7 (`BrowserRouter`) |
| Styling | Tailwind CSS v3 + custom CSS variables |
| HTTP Client | Axios (instance at `src/lib/axios.ts`) |
| Forms & Validation | `react-hook-form` + `@hookform/resolvers/zod` + `zod` |
| UI Components | shadcn/ui pattern (Radix UI + CVA + tailwind-merge) |
| Icons | lucide-react |

## Running the App

```bash
npm run dev      # dev server → http://localhost:5173
npm run build    # TypeScript check + Vite production build
```

Set `VITE_API_URL` in `.env` to point at the FastAPI backend (default: `http://localhost:8000/api/v1`).

## Backend Setup (Required)

**CORS Configuration Required:**
The backend MUST have CORS middleware configured to allow:
- `allow_origins`: Include `http://localhost:5173` and your production frontend URL
- `allow_methods`: `["*"]` (or at least `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`)
- `allow_headers`: `["*"]` (or at least `["Authorization", "Content-Type"]`)
- `allow_credentials`: `True`

See `CORS_SETUP.md` for FastAPI CORS configuration example.

Without proper CORS setup, browser will block OPTIONS preflight requests and all API calls will fail.

## Project Structure

```
src/
├── App.tsx                   # Root router + AuthProvider wrapper
├── main.tsx                  # React DOM entry
├── index.css                 # CSS design tokens + global utility classes
├── types/index.ts            # All TypeScript interfaces (User, Product, Order, etc.)
├── context/
│   ├── AuthContext.tsx       # Auth token + user state (localStorage-backed)
│   └── UIContext.tsx         # Global UI state (e.g. mobile sidebar toggle)
├── components/
│   ├── PrivateRoute.tsx      # Route guard — redirects to /login if no token
│   └── layout/
│       ├── AppLayout.tsx     # Shell: Sidebar + mobile menu backdrop
│       ├── Sidebar.tsx       # Responsive collapsible sidebar (232px expanded, 80px collapsed icon-only mode)
│       └── Sidebar.module.css # Sidebar button styles
├── lib/
│   ├── axios.ts              # Axios instance with Bearer token + 401 redirect
│   ├── utils.ts              # cn() helper (clsx + tailwind-merge)
│   └── api/
│       ├── auth.ts           # login, logout, me
│       ├── inventory.ts      # CRUD products
│       ├── providers.ts      # CRUD suppliers
│       ├── sells.ts          # Sales endpoints
│       ├── orders.ts         # Purchase orders
│       └── users.ts          # User management
└── pages/
    ├── Login/                # /login — split-panel layout + Login.module.css
    ├── Dashboard/            # / — KPI cards + Dashboard.module.css
    ├── Inventory/            # /inventario + Inventory.module.css
    ├── Providers/            # /proveedores + Providers.module.css
    ├── Sells/                # /ventas + Sells.module.css
    ├── Orders/               # /pedidos + Orders.module.css
    └── Users/                # /usuarios + Users.module.css
```

## Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | `Login` | Public |
| `/` | `Dashboard` | Protected |
| `/inventory` | `Inventory` | Protected |
| `/providers` | `Providers` | Protected |
| `/sells` | `Sells` | Protected |
| `/orders` | `Orders` | Protected |
| `/users` | `Users` | Protected |

All protected routes live inside `<PrivateRoute>` → `<AppLayout>`.

## Design System

Full spec at `.interface-design/system.md`. Summary:

### CSS Variables (defined in `src/index.css`)

```css
--bg: #ffffff                /* page canvas */
--surface: #F9F8F7           /* cards, sidebar (warm off-white) */
--surface-2: #F2F0EE         /* hovers, secondary surfaces */
--border: rgba(0,0,0,0.09)
--border-strong: rgba(0,0,0,0.16)
--ink-1: #111111             /* primary text */
--ink-2: #555550             /* secondary text */
--ink-3: #9B9B8E             /* metadata / placeholder */
--accent: #FACC15            /* brand yellow — THE only accent color */
--accent-hover: #EAB308
--accent-fg: #111111
--destructive: #DC2626       /* red — only for delete/error actions */
--success: #16A34A
--warning: #D97706
--control-bg: #F3F2F0        /* input backgrounds (inset feel) */
--sidebar-w: 232px
```

### Typography

- **Headlines/UI/Body/Labels:** `Bricolage Grotesque` (geometric sans-serif, modern and distinctive)
- **Data/Codes/SKUs:** `DM Mono`

### Utility Classes (defined in `src/index.css` `@layer components`)

| Class | Purpose |
|---|---|
| `.bin-label` | **Signature element** — monospace tag badge (e.g. `INV / Productos`) |
| `.bin-label--accent` | Yellow variant of bin-label |
| `.card` | Surface card with subtle shadow |
| `.badge` + modifiers | Status chips: `badge--success`, `badge--warning`, `badge--destructive`, `badge--neutral` |
| `.form-input` | Styled text input (inset control-bg, yellow focus ring) |
| `.btn-primary` | Black bg, white text |
| `.btn-accent` | Yellow bg, black text |
| `.btn-ghost` | Transparent, border, ink-2 |
| `.data-table` | Table with section `th` + hover rows |

### Design Rules

1. **One accent color only** — yellow `#FACC15`. Everything else uses ink hierarchy.
2. **Depth strategy: subtle shadows** — `0 1px 3px rgba(0,0,0,0.07)` on cards. No dramatic lifts.
3. **Sidebar same hue as canvas** — `border-right` is the only separator. Never use a different background color.
4. **Inputs are inset** — `--control-bg` is darker than surrounding surface.
5. **Bin-label on every section header** — this is the project's signature visual element.
6. **Yellow left-bar on active sidebar link** — 4px wide, `--accent`, centered vertically.
7. **Use only Bricolage Grotesque for UI** — this is the project's distinctive typography choice.
8. **Border radius:** `8px` buttons/inputs · `10px` cards · `14px` modals.

## Sidebar Behavior

- **Collapsible:** Toggle button in logo header collapses sidebar to icon-only mode
- **Expanded:** 232px width with full navigation labels and user footer
- **Collapsed:** 80px width with centered icons only, user section hidden
- **State Persistence:** `localStorage.sidebarCollapsed` (JSON boolean, defaults to false/expanded)
- **Animations:** Width transitions smoothly over 0.3s when toggling
- **Accessibility:** Navigation items use `title` attributes for tooltips in collapsed mode
- **Mobile:** Collapse state independent of mobile menu toggle
- **Footer Adaptation:** Shows user avatar + logout icon button when collapsed (centered layout)

## Inventory Page Layout

- **Page Header:** Title "Control de Inventario" + description + "Nuevo Producto" button
- **KPI Cards:** 4-column grid on desktop (responsive: 2-column on tablet, 1-column on mobile) showing:
  - Total Variantes (Grid icon, yellow accent) — from API `total_variants` (distinct product count)
  - Total Stock (Package icon, yellow accent) — from API `total_stock` (total quantity across all products)
  - Stock Bajo (AlertCircle icon, red destructive) — from API `low_stock_count` (products below threshold)
  - Valor Total (DollarSign icon, green success) — from API `total_inventory_value` (total value)
- **Controls Bar:** Horizontal layout with:
  - **Name/ID Search:** Text input with icon (placeholder: "Nombre o ID...")
  - **Categoría Dropdown:** Dynamic options from `inventoryApi.getCategories()`
  - **Material Dropdown:** Dynamic options from `inventoryApi.getMaterials()`
  - **Disponibilidad Select:** Standard select (Todos, En Stock, Stock Bajo)
- **Dynamic Dropdowns (API-Driven with Search):**
  - Load options from API when dropdown opens
  - API calls with pagination params: `skip: 0, limit: 100, search: userInput`
  - Search/filter triggers API request (debounced 300ms to avoid spam)
  - Response structure: `{ items: [{ id, name }], has_next, skip, limit }`
  - Click outside to close
  - Selected option shows option name in button label (stores ID internally)
  - Active selection highlighted in yellow
  - Loading spinner shows while fetching options
- **Stats Loading:** KPI cards load on component mount via `inventoryApi.getStats()` (calls `/inventory/stats/overview` endpoint once, independent of filters)
  - Response structure: `{ total_variants, total_stock, low_stock_count, total_inventory_value }`
  - Maps to state: `{ totalVariants, totalStock, lowStockCount, totalValue }`
- **API Parameters:** All filters sent to backend via `inventoryApi.getProducts(params)`:
  - `skip`: pagination offset `(page - 1) * limit`
  - `limit`: items per page (default: 10)
  - `search`: text search from name/ID input
  - `categoria`: selected category filter
  - `material`: selected material filter
  - `status`: disponibilidad filter (bajo/ok)
- **Data Table:** Product list with status badges, edit buttons, pagination
- **Pagination:** Previous/Next buttons, shows current page and total pages
- **Loading State:** Spinner while fetching products
- **Error Handling:** Fallback to mock data if API fails for categories/materials
- **Spacing:** 24px section gaps, 16px card padding, consistent grid layouts

## Tailwind Config

Extended in `tailwind.config.js`:
- Custom colors: `accent`, `destructive`, `surface`, `ink-*`, `control`
- Custom shadows: `card`, `elevated`
- Custom fonts: `sans` (Bricolage Grotesque), `mono` (DM Mono)
- Custom animations: `fade-in`, `slide-in`

## Auth Flow

**Login Flow:**
1. User submits email + password on `/login` page
2. `authApi.login()` sends request to `POST /auth/login` with `application/x-www-form-urlencoded` (FastAPI OAuth2 compatible)
3. Backend returns `{ access_token: string, token_type: "bearer" }`
4. `Login.tsx` extracts `res.data.access_token` and calls `AuthContext.login(token, user)`
5. `AuthContext.login()` stores token + user in `localStorage` and sets context state
6. User redirected to `/` (Dashboard)

**Axios Interceptor (Bearer Token):**
1. **Request interceptor:** On every API call, reads `token` from `localStorage.getItem('token')`
2. Adds header: `Authorization: Bearer {token}` to all requests (EXCEPT preflight OPTIONS)
3. **withCredentials:** Set to `false` (Bearer token doesn't use cookies/credentials)
4. **Response interceptor:** On 401 status, clears localStorage and redirects to `/login`
5. All API calls in `src/lib/api/*.ts` use this configured `api` instance automatically

**Note:** OPTIONS preflight requests do NOT include Authorization header - this is correct browser behavior. The OPTIONS response tells the browser which headers are allowed (including Authorization), then the actual request includes the token.

**Protected Routes:**
1. `<PrivateRoute>` reads `useAuth().isAuthenticated` (checks if `token` exists)
2. Redirects to `/login` if not authenticated
3. All routes except `/login` are protected inside `<PrivateRoute>` → `<AppLayout>`

**Token Persistence:**
- Token persists in `localStorage` across page refreshes
- `AuthContext` initializes from `localStorage` on app load via `useState` initializer
- Axios interceptor always includes token in requests (if it exists)

## TypeScript Types (`src/types/index.ts`)

Key interfaces: `User`, `Product`, `Category`, `Provider`, `Order`, `OrderItem`, `Sale`, `SaleItem`, `PaginatedResponse<T>`, `LoginPayload`, `AuthResponse`.

## Path Alias

`@/` maps to `src/` — configured in both `vite.config.ts` and `tsconfig.app.json`.

## Code Conventions

- All components are `.tsx` with default exports for pages (e.g. `export default function Dashboard()`)
- Pages use a Feature-Folder structure (`src/pages/[PageName]/[PageName].tsx`).
- Styling for pages strictly uses CSS Modules (`[PageName].module.css`).
- Extremely avoid inline styles (`style={{...}}`) or overly verbose Tailwind utility strings. Prefer extracting them to CSS modules using `@apply` and standard CSS.
- API modules use named object exports (e.g. `export const inventoryApi = { ... }`)
- No raw hex values in CSS — always use `var(--token-name)`
- Spanish labels throughout — maintain consistency (e.g. "Guardar", "Cancelar", "Editar", "Ver")
- All dates formatted as `DD/MM/YYYY`
- Currency formatted as `$ X,XXX.XX` (Peruvian Sol)
- Ensure all pages are mobile-responsive, utilizing Tailwind breakpoints (`sm:`, `md:`) and wrapping wide data tables in `overflow-x-auto` to allow horizontal scrolling on small screens.
- **No redundant or unnecessary comments:** Write self-documenting code with clear variable/function names. Only add comments to explain WHY, not WHAT. Avoid comments like `// increment counter` or `// set loading state`. Remove comments that simply repeat the code.

## Assistant Rules

- **ALWAYS create a plan BEFORE implementing any feature or significant change:**
  - Use `/brainstorming` skill to explore requirements and design
  - Present options and get user approval before writing code
  - Document the plan in comments before implementation
  - This prevents rework and ensures alignment on approach
- **ALWAYS update `CLAUDE.md` on breaking changes or structural updates:**
  - New component files or directories added
  - Major component behavior changes (e.g., collapsible sidebar)
  - New state management patterns
  - Font, color, or design system changes
  - New CSS modules or styling patterns
  - localStorage keys or persistent state changes
  - Route additions/removals
  - API endpoint structure changes
  - Dependencies added/removed/upgraded
  - **Update Section:** Identify which CLAUDE.md section(s) need updates (Project Structure, Sidebar Behavior, Tailwind Config, Design System, etc.) and keep documentation in sync with actual code.
- **Use Tailwind CSS, CSS, and shadcn/ui** to develop and build out components. (This supersedes any previous instructions to avoid shadcn).
