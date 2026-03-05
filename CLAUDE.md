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
│   ├── ProductDropdown/      # Reusable debounced API dropdown for product form fields
│   │   ├── ProductDropdown.tsx         # Component: openDropdownId, fetchOptions, onSelect, onAddNew props
│   │   └── ProductDropdown.module.css  # Dropdown/spinner styles
│   ├── CreateEntityModal/    # Generic portal modal for creating filter entities (category/brand/material/measurementUnit)
│   │   ├── CreateEntityModal.tsx       # Component: type, onClose, onCreated props; calls API internally
│   │   └── CreateEntityModal.module.css # Modal styles
│   ├── ConfirmDeleteModal/   # Portal modal for confirming product/sale deletion
│   │   ├── ConfirmDeleteModal.tsx      # Component: productName, onConfirm (async), onClose props; handles isDeleting state + error display
│   │   └── ConfirmDeleteModal.module.css # Modal styles with destructive button
│   ├── CreateClientModal/    # Portal modal for creating a new sale client
│   │   └── CreateClientModal.tsx       # Component: onClose, onCreated props; fields: name (required), identity_card, email, phone
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
│       ├── sales.ts          # Sales endpoints
│       ├── orders.ts         # Purchase orders
│       └── users.ts          # User management
└── pages/
    ├── Login/                # /login — split-panel layout + Login.module.css
    ├── Dashboard/            # / — KPI cards + Dashboard.module.css
    ├── Inventory/            # /inventory — product list + Inventory.module.css
    ├── ProductForm/          # /inventory/create + /inventory/product/:id — unified create/view/edit page
    │   ├── ProductForm.tsx             # Mode detection: isCreateMode = !useParams().id
    │   └── ProductForm.module.css      # Layout-only CSS (header, sectionsGrid, cards, field rows)
    ├── Providers/            # /providers + Providers.module.css
    ├── Sales/                # /sales + Sales.module.css
    ├── SaleForm/             # /sales/create + /sales/:id — unified create/view/edit page + SaleForm.module.css
    ├── Orders/               # /orders + Orders.module.css
    └── Users/                # /users + Users.module.css
```

## Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | `Login` | Public |
| `/` | `Dashboard` | Protected |
| `/inventory` | `Inventory` | Protected |
| `/inventory/create` | `ProductForm` (create mode) | Protected |
| `/inventory/product/:id` | `ProductForm` (view/edit mode) | Protected |
| `/providers` | `Providers` | Protected |
| `/sales` | `Sales` | Protected |
| `/sales/create` | `SaleForm` (create mode) | Protected |
| `/sales/:id` | `SaleForm` (view/edit mode) | Protected |
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

### Utility Classes (defined in `src/index.css` `@layer components` and locally)

| Class | Purpose |
|---|---|
| `.bin-label` | **Signature element** — monospace tag badge (e.g. `INV / Productos`) |
| `.bin-label--accent` | Yellow variant of bin-label |
| `.card` | Surface card with subtle shadow |
| `.badge--[type]` | Sharp status chips: `badge--success`, `badge--warning`, `badge--destructive`. (Border-defined, high-density style) |
| `.form-input` | Styled text input (inset control-bg, yellow focus ring) |
| `.btn-primary` | Black bg, white text |
| `.btn-accent` | Yellow bg, black text |
| `.btn-ghost` | Transparent, border, ink-2 |
| `:global(.data-table)` | Industrial layout: right-aligned mono numbers, tight borders, dense rows |

### Design Rules

1. **One accent color only** — yellow `#FACC15`. Everything else uses ink hierarchy.
2. **Color contrast structure:**
   - **Page background:** Light gray `#F3F4F6` (--bg-page) for main content area
   - **Cards & UI:** White `#ffffff` (--surface) for KPI strips, command bars, tables, sidebar
   - **Secondary surfaces:** Warm off-white `#F9F8F7` (--surface-2) for table headers, hover states
3. **Depth strategy:** Focus on rigid structural borders (`1px`) and dense layouts over soft floating drop shadows. Only use drop shadows for floating dropdowns, everything else should snap together (e.g. "Flush Rail" sidebar).
4. **Sidebar "Flush Rail":** Maintains visual separation from gray page background via `border-right` without rounding the container or adding card shadows. Active items use edge-to-edge flush backgrounds with a sharp left-border indicator.
5. **KPI Strip (Data Terminal format):**
   - Solid white background container (`.kpiStrip`)
   - Flex layout fused side-by-side with 1px structural dividers (`.kpiDivider`). No gap margins or outer shadows.
   - Column layout inside with a top-left flex header (icon + label) and a massive monospace value below.
6. **Breadcrumb:** Monospace, dense upper-case text with structural dividers, no background.
7. **Active Highlights:** Sharp `3px solid var(--accent)` left-bar on active layout containers (sidebar links, command-bar dropdowns).
8. **Use only Bricolage Grotesque for UI & DM Mono for Data** — Ensure rigorous right-alignment on all tabular numbers.
9. **Border radius:** `0` to `4px` for structural elements and form controls (cards, inputs, buttons) · `10px` only for top-level layout containers.
10. **Form Controls:** Text/Number inputs (`.inputField`) use sharp borders (`4px` radius) with solid focus states (`var(--accent)` border and `var(--surface-2)` background), rejecting soft blurred drop shadows. Data entry must feel like a tabular terminal.

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
  - Breadcrumb: Dense, monospace "INV / Productos" (11px font)
  - Title "Inventario Principal" + `Nuevo Producto` highly structured button with black background
- **KPI "Data Terminal" Strip:** 1-column responsive layout that collapses into a single horizontal block on desktop:
  - Fused block: No margins or borders between items, just 1px internal dividers.
  - Highlighted labels with corresponding semantic colors.
  - High impact, strict `DM Mono` numerals.
- **Unified Command Bar & Filters:**
  - Placed horizontally in a flush, seamless `.commandBar` without a floating container card.
  - **Name/ID Search:** Flex-1 width cleanly integrated without nested borders.
  - Dropdown Triggers: Ghost buttons that bleed into the command bar; active triggers show sharp bottom-borders (on desktop) or left-borders (on mobile) using `var(--accent)`.
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
  - Active selection highlighted via `box-shadow: inset 0 -2px 0 var(--accent)`
  - Loading spinner shows while fetching options
  - **Structure:** Dropdown trigger button and `.dropdownMenu` must be wrapped in a `.dropdownWrapper` (`position: relative; flex: 1`) to ensure the popover width exactly matches the input button and not the parent container. The wrapper dynamically elevates its z-index when open to avoid overlapping form fields.
- **Stats Loading:** KPI cards load on component mount via `inventoryApi.getStats()`
  - Response structure: `{ total_variants, total_stock, low_stock_count, total_inventory_value }`
  - Maps to state: `{ totalVariants, totalStock, lowStockCount, totalValue }`
- **Data Table:** Product list with strict industrial styling:
  - Container fuses seamlessly under the `.commandBar`.
  - Header: Strict `border-bottom: 1px solid var(--border-strong)`.
  - Columns 5, 6, 9 (Stock, Mín., Price): Strict right-alignment layout.
  - Rows: Subtle border-bottom (1px), sharp typographic contrast.
  - Badges: Sharp `.badge--[status]` classes using transparency rather than solid pastel blobs.
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

## Product Form Layout (`/inventory/create` & `/inventory/product/:id`)

- **Page Header:**
  - Breadcrumb: Standardized "INV / Registro" or "INV / Producto" structure.
  - Actions: Strict block-level buttons (Save, Cancel, Edit, Delete). Action buttons do not float, they snap into place with `4px` minimal rounding.
- **Data Terminal Panels (`.card`):**
  - High-density containers with `4px` borders and minimal `0.02` opacity drop shadows to act as structural blocks rather than floating SaaS cards.
  - Divided horizontally into "Información General", "Valores Económicos", and "Control de Stock".
- **Form Controls:**
  - Standard `.inputField`: `border-radius: 4px`, solid borders.
  - Focus state: Hard switch to `var(--surface-2)` background + `var(--accent)` border, no blurred glow.
  - Price, Cost, Size, Stock: Strictly `DM Mono` (`.mono`) and right-aligned to create a rigorous data-entry mathematical feel.

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

Key interfaces: `User`, `Product`, `Category`, `Provider`, `Order`, `OrderItem`, `Sale`, `SaleItem`, `CreateSaleInput`, `PaginatedResponse<T>`, `CursorPaginatedResponse<T>`, `LoginPayload`, `AuthResponse`, `FilterOption`, `CreateProductInput`.

**Pagination types:**
- `PaginatedResponse<T>` — `{ items, total, page, size, pages }` — used by inventory/users endpoints
- `CursorPaginatedResponse<T>` — `{ items, has_next, skip, limit }` — used by sales endpoints

**Sale type** matches actual API shape:
- `id`, `total_amount`, `debt_amount`, `amount_paid`, `client_id`
- `payment_status: PaymentStatus` — `'pending' | 'paid' | 'partial'`
- `delivery_status: DeliveryStatus` — `'pending' | 'partial' | 'delivered'`
- `payment_method: PaymentMethod` — `'cash' | 'card' | 'transfer' | null`
- `created_by: Pick<User, ...>`, `client: { id, name } | null`

## Sales API Endpoints (`src/lib/api/sales.ts`)

- `getSales(params?)` — `GET /sales` → `CursorPaginatedResponse<Sale>`
  - Params: `skip`, `limit`, `user_id`, `client_id`, `no_client`, `payment_method`, `delivery_status`, `payment_status`, `start_date`, `end_date`
- `getSale(id)` — `GET /sales/{id}`
- `getSaleItems(id, params?)` — `GET /sales/{id}/items` → `CursorPaginatedResponse<SaleItem>`
- `getClients(params?)` — `GET /sales/clients` → `CursorPaginatedResponse<{ id, name }>`
  - `createClient(data)` — `POST /sales/clients` — fields: `name` (required), `identity_card?`, `email?`, `phone?`
- `getStats()` — `GET /sales/stats` → `{ unpaid_count, undelivered_count, total_amount_sum, amount_paid_sum }`
- `createSale(data)` — `POST /sales`
- `updateSale(id, data)` — `PATCH /sales/{id}` — fields: `payment_method?`, `amount_paid?`, `client_id?`
- `deleteSale(id)` — `DELETE /sales/{id}`
- `addSaleItem(saleId, data)` — `POST /sales/{id}/items` — fields: `product_id`, `quantity`, `delivered_quantity`, `unit_price?`
- `updateSaleItem(saleId, itemId, data)` — `PUT /sales/{id}/items/{itemId}` — fields: `quantity?`, `delivered_quantity?`, `unit_price?`
- `deleteSaleItem(saleId, itemId)` — `DELETE /sales/{id}/items/{itemId}`

## SaleForm Page (`/sales/create` & `/sales/:id`)

Mode detection: `const isCreateMode = !useParams().id`

### Create mode (`/sales/create`)
- **Breadcrumb:** `VNT / Nueva Venta`
- **Layout:** 2-column grid (`3fr 2fr`) — items on left, summary + details on right
- **Product search:** Debounced input (300ms) → `inventoryApi.getProducts()`. Results dropdown shows name, size, SKU, price, and category/brand/material tags. Selecting adds an item card; duplicate products are blocked.
- **Item cards:** Yellow left-border accent. Shows product name, SKU badge, category/brand/material tags. Three inputs: Cantidad, Cant. entregada, Precio unit. (empty = `null` in payload = use backend default).
- **Live validation:** `delivered_quantity ≤ quantity` per item (red border + inline error); `amount_paid ≤ estimated total` (red border + inline error). Save button disabled while errors exist.
- **Right panel:**
  - Resumen card: item count + estimated total
  - Detalles card: Cliente (API dropdown + `+` button opens `CreateClientModal`), Estado pago, Método pago, Monto pagado — all using custom `selectDropdown`/`selectTrigger`/`selectContent` pattern (no native `<select>`)
- **Payload:** `POST /sales` via `salesApi.createSale(CreateSaleInput)`. On success → navigates to `/sales`.

### View/Edit mode (`/sales/:id`)
- Loads sale via `salesApi.getSale(id)` + items via `salesApi.getSaleItems(id)` in parallel on mount
- **View mode header:** Eliminar (ghost destructive, opens `ConfirmDeleteModal`) + Editar (dark filled) buttons
- **Edit mode header:** Cancelar + Guardar buttons; Guardar disabled while live validation errors exist
- **Editable fields (edit mode):** Cliente, Método pago, Monto pagado — same dropdown pattern as create
- **Items in edit mode:**
  - Product search at top of Productos card (same debounced search) → selecting adds a **draft card** (dashed grey left border, no API call yet)
  - Draft cards have pre-filled inputs + green checkmark (POST to save) + X (discard)
  - Saved item cards show editable inputs with green checkmark (PUT on click) + X (DELETE)
  - Live validation: `delivered_quantity ≤ quantity` per item; `amount_paid ≤ total`
- **Resumen card (edit mode):** Total and Deuda computed locally from current `editingItems` + `pendingItems` state — updates live as inputs change
- **Form dropdowns pattern** (`selectDropdown` in SaleForm.module.css): `border: 1px solid var(--border-strong)`, `border-radius: 4px`, height `40px`. Active: `box-shadow: inset 0 -2px 0 var(--accent)`.

### Sales table (Sales.tsx)
- Last column has Eye button (navigate to `/sales/:id`) + Trash button (opens `ConfirmDeleteModal`)
- After deletion: reloads table and stats via `reloadTrigger` counter state

## Sales Page Layout (`/sales`)

- **Breadcrumb:** `VNT / Registro`
- **KPI Strip:** Loads from `salesApi.getStats()` on mount — 4 items: Total ventas, Total cobrado, Sin pagar, Sin entregar
- **Command Bar filters** (right-aligned on desktop):
  - **Usuario** — debounced API dropdown from `usersApi.getUsers()`, sends `user_id`
  - **Cliente** — debounced API dropdown from `salesApi.getClients()`, includes "Sin cliente" option → sends `no_client=true`; specific client → sends `client_id`
  - **Método pago** — static dropdown: `cash`, `credit`, `debit` → sends `payment_method`
  - **Entrega** — static dropdown: `pending`, `partial`, `delivered` → sends `delivery_status`
  - **Estado pago** — static dropdown: `paid`, `pending`, `partial` → sends `payment_status`
  - **Fecha inicio / Fecha fin** — native `<input type="date">` → sends `start_date` / `end_date`
- **Table columns:** Código, Cliente, Total, Pagado, Deuda, Pago (badge), Entrega (badge), Usuario, Fecha, Ver
- **Badges:** Defined as local CSS module classes (`.badge--success`, `.badge--warning`, `.badge--destructive`) referenced via `styles[key]`
- **Pagination:** `has_next`-based prev/next buttons (no total count)

## Inventory API Endpoints (`src/lib/api/inventory.ts`)

**Product Management:**
- `getProducts(params?)` — `GET /inventory/products` with pagination, search, filters
- `getProduct(id)` — `GET /inventory/products/{id}`
- `createProduct(data: CreateProductInput)` — `POST /inventory/products`
- `updateProduct(id, data)` — `PUT /inventory/products/{id}`
- `deleteProduct(id)` — `DELETE /inventory/products/{id}`

**Filter/Dropdown Data:**
- `getCategories(params?)` — `GET /inventory/categories` → returns `PaginatedResponse<FilterOption>`
- `getMaterials(params?)` — `GET /inventory/materials` → returns `PaginatedResponse<FilterOption>`
- `getBrands(params?)` — `GET /inventory/brands` → returns `PaginatedResponse<FilterOption>`
- `getMeasurementUnits(params?)` — `GET /inventory/measurement-units` → returns `PaginatedResponse<FilterOption>`
- `createMaterial/createCategory/createBrand/createMeasurementUnit` — POST endpoints for entity creation

**Statistics:**
- `getStats()` — `GET /inventory/products/stats/overview` → returns stats (total variants, stock, low stock count, total value)

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
