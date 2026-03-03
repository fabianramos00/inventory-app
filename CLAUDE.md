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
│   ├── UIContext.tsx         # Global UI state (e.g. mobile sidebar toggle)
│   └── ModalContext.tsx      # Modal visibility state for backdrop blur (provides isModalOpen, openModal(), closeModal())
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
    ├── Inventory/            # /inventory — product list + Inventory.module.css
    ├── CreateProduct/        # /inventory/create — product creation form + CreateProduct.module.css
    ├── Providers/            # /providers + Providers.module.css
    ├── Sells/                # /sells + Sells.module.css
    ├── Orders/               # /orders + Orders.module.css
    └── Users/                # /users + Users.module.css
```

## Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | `Login` | Public |
| `/` | `Dashboard` | Protected |
| `/inventory` | `Inventory` | Protected |
| `/inventory/create` | `CreateProduct` | Protected |
| `/providers` | `Providers` | Protected |
| `/sells` | `Sells` | Protected |
| `/orders` | `Orders` | Protected |
| `/users` | `Users` | Protected |

All protected routes live inside `<PrivateRoute>` → `<AppLayout>`.

## Design System

Full spec at `.interface-design/system.md`. Summary:

### CSS Variables (defined in `src/index.css`)

```css
--bg: #ffffff                /* white — sidebar, cards, UI elements */
--bg-page: #F3F4F6           /* light gray — main page background for contrast */
--surface: #ffffff           /* white — card backgrounds (KPI, filters, table) */
--surface-2: #F8FAFC         /* cool blue-gray (slate-50) — header backgrounds, hovers */
--border: #E5E7EB            /* slate-200 — cool blue-gray borders */
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
--control-bg: #F8FAFC        /* cool blue-gray (slate-50) — input backgrounds (inset feel) */
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
2. **Color contrast structure:**
   - **Page background:** Light gray `#F3F4F6` (--bg-page) for main content area
   - **Cards & UI:** White `#ffffff` (--surface) for KPI cards, filter controls, tables, sidebar
   - **Secondary surfaces:** Warm off-white `#F9F8F7` (--surface-2) for table headers, hover states
3. **Depth strategy: subtle shadows** — `0 1px 2px rgba(0,0,0,0.07)` on cards. No dramatic lifts.
4. **Sidebar white background** — maintains visual separation from gray page background via `border-right`.
5. **KPI cards:**
   - White background with 1px border
   - 4px left border with color-matched icon: Yellow (accent), Orange (warning), Red (destructive), Green (success)
   - Icon positioned absolutely top-right in 44px square with tinted background
   - Column layout with label above value
6. **Breadcrumb:** Simple text with icon colors, no background — adapts to page background.
7. **Yellow left-bar on active sidebar link** — 4px wide, `--accent`, centered vertically.
8. **Use only Bricolage Grotesque for UI** — this is the project's distinctive typography choice.
9. **Border radius:** `8px` buttons/inputs · `10px` cards · `14px` modals.

## Sidebar Behavior

- **Collapsible:** Toggle button in logo header collapses sidebar to icon-only mode
- **Expanded:** 232px width with full navigation labels and user footer
- **Collapsed:** 80px width with centered icons only, user section hidden
- **State Persistence:** `localStorage.sidebarCollapsed` (JSON boolean, defaults to false/expanded)
- **Animations:** Width transitions smoothly over 0.3s when toggling
- **Accessibility:** Navigation items use `title` attributes for tooltips in collapsed mode
- **Mobile:** Collapse state independent of mobile menu toggle
- **Footer Adaptation:** Shows user avatar + logout icon button when collapsed (centered layout)

## Modal Context & Backdrop Blur

**Global Modal State Management** (`src/context/ModalContext.tsx`):
- **Purpose:** Track when any modal is open to apply blur effect to entire page (sidebar + content)
- **API:**
  - `useModalContext()` — returns `{ isModalOpen: boolean, openModal(): void, closeModal(): void }`
  - `ModalProvider` — wraps `AppLayout` in `App.tsx` (already integrated)
- **AppLayout Integration:**
  - AppLayout wraps root div with blur class when `isModalOpen` is true
  - Blur styling in `src/components/layout/AppLayout.module.css`: `filter: blur(4px); pointer-events: none;`
  - Applies to entire page (sidebar + main content) for clear visual focus on modals
  - Smooth 0.3s transition using `transition-all duration-300`
- **Page Integration (CreateProduct Example):**
  - Import `useModalContext` hook
  - Call `contextOpenModal()` when modal opens (usually when `openModal` state is set to non-null)
  - Call `contextCloseModal()` when modal closes (usually when `openModal` state is set to null)
  - Typically done via `useEffect` watching the local `openModal` state:
    ```typescript
    useEffect(() => {
      if (openModal) {
        contextOpenModal()
      } else {
        contextCloseModal()
      }
    }, [openModal, contextOpenModal, contextCloseModal])
    ```
  - Keep page-level modal state (which modal type is open, form data, errors) in component
  - Only use context for the global blur toggle (is ANY modal open)

## Inventory Page Layout

- **Page Header:**
  - Breadcrumb: Simple text "INV / Productos" (12px font, no background) with secondary color
  - Title "Control de Inventario" + description + "Nuevo Producto" button
- **KPI Cards:** 4-column grid on desktop (responsive: 2-column on tablet, 1-column on mobile) with refined styling:
  - Layout: Column flex with icon positioned absolutely top-right corner
  - Card styling: White background (`var(--surface)`) with 1px border, subtle shadow (0 1px 2px rgba(0,0,0,0.07))
  - Left border: 4px colored border matching icon/text color:
    - Total Variantes: Yellow (`--accent`) with Grid icon
    - Total Stock: Orange (`--warning`) with Package icon
    - Stock Bajo: Red (`--destructive`) with AlertCircle icon
    - Valor Total: Green (`--success`) with DollarSign icon
  - Icon: 44px square positioned `top: 16px; right: 16px;` with tinted background (e.g., rgba(250, 204, 21, 0.1)), colored text
  - Content: Uppercase label (12px) above large bold value (24px) — no icon in content area
  - Hover: Subtle shadow enhancement
- **Filters Card Container:**
  - Wraps all filter controls in dedicated card element
  - Background: `var(--surface)` with 1px border and 10px border-radius
  - Padding: 16px with subtle shadow (0 1px 2px rgba(0,0,0,0.04))
- **Controls Bar (inside Filters Card):** Horizontal flex layout (responsive stacks on mobile) with:
  - **Name/ID Search:** Text input with icon (placeholder: "Nombre o ID...")
  - **Categoría Dropdown:** Dynamic options from `inventoryApi.getCategories()`
  - **Material Dropdown:** Dynamic options from `inventoryApi.getMaterials()`
  - **Marca Dropdown:** Dynamic options from `inventoryApi.getBrands()`
  - **Disponibilidad Select:** Standard select (Todos, En Stock, Stock Bajo, Sin Stock)
- **Dynamic Dropdowns (API-Driven with Search):**
  - Load options from API when dropdown opens
  - API calls with pagination params: `skip: 0, limit: 10, search: userInput`
  - Search/filter triggers API request (debounced 300ms to avoid spam)
  - Response structure: `{ items: [{ id, name }], has_next, skip, limit }`
  - Click outside to close
  - Selected option shows option name in button label (stores ID internally)
  - Active selection highlighted in yellow (`rgba(250, 204, 21, 0.12)`)
  - Loading spinner shows while fetching options
- **Stats Loading:** KPI cards load on component mount via `inventoryApi.getStats()` (calls `/inventory/stats/overview` endpoint once, independent of filters)
  - Response structure: `{ total_variants, total_stock, low_stock_count, total_inventory_value }`
  - Maps to state: `{ totalVariants, totalStock, lowStockCount, totalValue }`
- **Data Table:** Product list with enhanced styling:
  - Header: Light gray background (`var(--surface-2)`) with 1px bottom border, uppercase labels
  - Columns 5 & 6 (Stock, Mín.): Center-aligned numeric values
  - Rows: Subtle border-bottom (1px), smooth hover effect to `var(--surface-2)`
  - Cells: Consistent 12px padding, proper typography hierarchy
- **API Parameters:** All filters sent to backend via `inventoryApi.getProducts(params)`:
  - `skip`: pagination offset `(page - 1) * limit`
  - `limit`: items per page (default: 10)
  - `search`: text search from name/ID input
  - `category_id`: selected category filter (numeric ID)
  - `material_id`: selected material filter (numeric ID)
  - `brand_id`: selected brand filter (numeric ID)
  - `stock_status`: disponibilidad filter (in_stock, low_stock, out_of_stock)
- **Pagination:** Previous/Next buttons, shows current page and total pages
- **Loading State:** Spinner while fetching products
- **Error Handling:** Fallback to mock data if API fails for categories/materials
- **Spacing:** 32px section gaps, 16px card padding inside containers, consistent grid layouts

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

Key interfaces: `User`, `Product`, `Category`, `Provider`, `Order`, `OrderItem`, `Sale`, `SaleItem`, `PaginatedResponse<T>`, `LoginPayload`, `AuthResponse`, `FilterOption`, `CreateProductInput`.

## Inventory API Endpoints (`src/lib/api/inventory.ts`)

**Product Management:**
- `getProducts(params?)` — `GET /inventory/variants` with pagination, search, filters
- `getProduct(id)` — `GET /inventory/variants/{id}`
- `createProduct(data: CreateProductInput)` — `POST /inventory/variants`
- `updateProduct(id, data)` — `PUT /inventory/variants/{id}`
- `deleteProduct(id)` — `DELETE /inventory/variants/{id}`

**Filter/Dropdown Data:**
- `getCategories(params?)` — `GET /inventory/categories` → returns `PaginatedResponse<FilterOption>`
- `getMaterials(params?)` — `GET /inventory/materials` → returns `PaginatedResponse<FilterOption>`
- `getBrands(params?)` — `GET /inventory/brands` → returns `PaginatedResponse<FilterOption>`
- `getSalesUnits(params?)` — `GET /inventory/sales-units` → returns `PaginatedResponse<FilterOption>`
- `getSizeUnits(params?)` — `GET /inventory/size-units` → returns `PaginatedResponse<FilterOption>`

**Statistics:**
- `getStats()` — `GET /inventory/variants/stats/overview` → returns stats (total variants, stock, low stock count, total value)

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
