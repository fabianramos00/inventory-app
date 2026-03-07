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
│   ├── Dropdown/             # Reusable dropdown component for filters and forms
│   │   ├── Dropdown.tsx      # Component: value, options, onChange, placeholder, isLoading, onOpen, isControlled, onOpenChange, disabled props
│   │   └── Dropdown.module.css # Dropdown styling with animations
│   ├── ProductDropdown/      # Reusable debounced API dropdown for product form fields
│   │   ├── ProductDropdown.tsx         # Component: openDropdownId, fetchOptions, onSelect, onAddNew props
│   │   └── ProductDropdown.module.css  # Dropdown/spinner styles
│   ├── CreateEntityModal/    # Generic portal modal for creating filter entities (category/brand/material/measurementUnit)
│   │   ├── CreateEntityModal.tsx       # Component: type, onClose, onCreated props; calls API internally
│   │   └── CreateEntityModal.module.css # Modal styles
│   ├── ConfirmDeleteModal/   # Portal modal for confirming product/sale deletion
│   │   ├── ConfirmDeleteModal.tsx      # Component: productName, onConfirm (async), onClose props; handles isDeleting state + error display
│   │   └── ConfirmDeleteModal.module.css # Modal styles with destructive button
│   ├── CreateFormModal/      # Generic portal modal for creating/editing any entity via a field config array
│   │   ├── CreateFormModal.tsx         # Component: title, fields: FieldConfig[], onSubmit (async, caller owns API), onClose, onCreated, initialValues? props
│   │   └── CreateFormModal.module.css  # Modal and form field styling
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
│       ├── clients.ts        # CRUD clients
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
    ├── Clients/              # /clients + Clients.module.css
    ├── Sales/                # /sales + Sales.module.css
    ├── SaleForm/             # /sales/create + /sales/:id — unified create/view/edit page + SaleForm.module.css
    ├── Orders/               # /orders + Orders.module.css
    ├── OrderForm/            # /orders/create + /orders/:id — unified create/view/edit page + OrderForm.module.css
    │   ├── OrderForm.tsx             # Mode detection: isCreateMode = !useParams().id
    │   └── OrderForm.module.css      # Copy of SaleForm.module.css + .emptyFieldValue class
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
| `/clients` | `Clients` | Protected |
| `/sales` | `Sales` | Protected |
| `/sales/create` | `SaleForm` (create mode) | Protected |
| `/sales/:id` | `SaleForm` (view/edit mode) | Protected |
| `/orders` | `Orders` | Protected |
| `/orders/create` | `OrderForm` (create mode) | Protected |
| `/orders/:id` | `OrderForm` (view/edit mode) | Protected |
| `/users` | `Users` | Protected (Superuser only) |

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

Full design spec in `.interface-design/system.md`. Core principles:
1. **One accent color only** — yellow `#FACC15`
2. **Structural borders** (1px) instead of soft shadows, except floating dropdowns
3. **Border radius:** 4px max for controls, 10px for top-level containers
4. **Typography:** Bricolage Grotesque for UI, DM Mono for data (right-aligned)
5. **Active states:** Sharp `3px` left-border with accent color
6. **Form controls:** Solid focus state with accent border + surface-2 background, no soft shadows

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

**Breadcrumb:** `INV / Productos` (DM Mono, 11px) | **Header:** Title "Inventario Principal" + button "Nuevo Producto" (black bg, yellow hover)

**KPI Strip:** Loads via `inventoryApi.getStats()` on mount — 4 cards: total_variants, total_stock, low_stock_count, total_inventory_value. 1px dividers, DM Mono values.

**Filters:** Name/ID search (icon input), Category/Material/Marca dropdowns (dynamic, load on open), Disponibilidad (static: Todos/En Stock/Stock Bajo/Sin Stock). Active state: accent bottom border.

**Table:** Product list with right-aligned numeric columns (Stock, Mín., Price), subtle row borders, status badges. Pagination: previous/next buttons with page number.

**API params:** skip, limit, search, category_id, material_id, brand_id, stock_status

## Product Form Layout (`/inventory/create` & `/inventory/product/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Breadcrumb:** `INV / Registro` or `INV / Producto`

**Layout:** 3 cards: Información General, Valores Económicos, Control de Stock. 4px borders, minimal shadow.

**Controls:** Text inputs (4px radius, solid borders), focus state: surface-2 background + accent border. Numeric fields (Price, Cost, Size, Stock): DM Mono, right-aligned.

**Features:** Product/Category/Material/Brand/Unit dropdowns (with "Agregar nuevo" buttons open CreateEntityModal). Image upload/preview. Save/Cancel/Edit/Delete buttons (block-level, 4px radius).

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

Key interfaces: `User`, `Product`, `Category`, `Provider`, `Client`, `Order`, `OrderItem`, `Sale`, `SaleItem`, `CreateSaleInput`, `CreateOrderInput`, `PaginatedResponse<T>`, `CursorPaginatedResponse<T>`, `LoginPayload`, `AuthResponse`, `FilterOption`, `CreateProductInput`.

**Pagination types:**
- `PaginatedResponse<T>` — `{ items, total, page, size, pages }` — used by inventory/users/providers endpoints
- `CursorPaginatedResponse<T>` — `{ items, has_next, skip, limit }` — used by sales and orders endpoints

**Order type** matches actual API shape:
- `id`, `provider_id`, `status: OrderStatus`, `payment_status: OrderPaymentStatus`, `order_date`, `total_amount`
- `provider: { id, name, contact_info, email, phone }`
- `OrderStatus` — `'pending' | 'sent' | 'received' | 'cancelled'`
- `OrderPaymentStatus` — `'pending' | 'paid'`

**OrderItem type** matches actual API shape:
- `id`, `order_id`, `product_id`, `quantity`, `unit_cost`, `subtotal`
- `supplier_sku: string | null`, `product_name: string`, `product_sku: string`

**CreateOrderInput:**
- `provider_id`, `status`, `payment_status`, `items: [{ product_id, quantity, unit_cost, supplier_sku? }]`

**Sale type** matches actual API shape:
- `id`, `total_amount`, `debt_amount`, `amount_paid`, `client_id`
- `payment_status: PaymentStatus` — `'pending' | 'paid' | 'partial'`
- `delivery_status: DeliveryStatus` — `'pending' | 'partial' | 'delivered'`
- `payment_method: PaymentMethod` — `'cash' | 'card' | 'transfer' | null`
- `created_by: Pick<User, ...>`, `client: { id, name } | null`

## Sales API Endpoints (`src/lib/api/sales.ts`)

- `getSales(params?)` — `GET /sales` with filters: skip, limit, user_id, client_id, no_client, payment_method, delivery_status, payment_status, start_date, end_date
- `getSale(id)` — `GET /sales/{id}`
- `getSaleItems(id, params?)` — `GET /sales/{id}/items`
- `getClients(params?)` — `GET /sales/clients`; `createClient(data)` — `POST /sales/clients` (name required, identity_card/email/phone optional)
- `getStats()` — `GET /sales/stats` → unpaid_count, undelivered_count, total_amount_sum, amount_paid_sum
- `createSale(data)` — `POST /sales`; `updateSale(id, data)` — `PATCH /sales/{id}` (payment_method?, amount_paid?, client_id?); `deleteSale(id)` — `DELETE /sales/{id}`
- `addSaleItem(saleId, data)` — `POST /sales/{id}/items` (product_id, quantity, delivered_quantity, unit_price?); `updateSaleItem(saleId, itemId, data)` — `PUT /sales/{id}/items/{itemId}`; `deleteSaleItem(saleId, itemId)` — `DELETE /sales/{id}/items/{itemId}`

## SaleForm Page (`/sales/create` & `/sales/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Create mode:** 2-column layout (items left, summary+details right). Breadcrumb `VNT / Nueva Venta`. Debounced product search (300ms), item cards with yellow left-border, fields: Cantidad, Cant. entregada, Precio unit. Right panel has Resumen card (item count + total) and Detalles card (Cliente dropdown + payment fields). Live validation on delivered_quantity and amount_paid. Save via `POST /sales`.

**View/Edit mode:** Two independent scoped edit states — `isEditingItems` (product search + per-item controls) and `isEditingDetails` (Cliente, Método pago, Monto pagado). Per-item controls: ✓ (PUT) + ✗ (DELETE) with spinners. New items draft cards (POST on ✓). Live validation per item. Resumen updates live. Debt = `total − amount_paid`. Delete button opens `ConfirmDeleteModal`.

**Dropdowns:** Custom pattern in SaleForm.module.css with `border: 1px solid var(--border-strong)`, `height: 40px`, active state: `box-shadow: inset 0 -2px 0 var(--accent)`.

## Sales Page Layout (`/sales`)

**Breadcrumb:** `VNT / Registro` | **KPI Strip:** Total ventas, Total cobrado, Sin pagar, Sin entregar (loads from `salesApi.getStats()`)

**Filters:** Usuario (debounced API), Cliente (debounced API + "Sin cliente" option), Método pago (static), Entrega (static), Estado pago (static), Date range (native inputs)

**Table:** Código, Cliente, Total, Pagado, Deuda, Pago (badge), Entrega (badge), Usuario, Fecha, Eye+Trash buttons | **Pagination:** `has_next`-based prev/next

## Orders API Endpoints (`src/lib/api/orders.ts`)

- `getOrders(params?)` — `GET /supply-chain/purchase-orders` with filters: skip, limit, provider_id, payment_status, status, min_date, max_date
- `getOrder(id)` — `GET /supply-chain/purchase-orders/{id}`; `getOrderItems(id, params?)` — `GET /supply-chain/purchase-orders/{id}/items`
- `createOrder(data: CreateOrderInput)` — `POST /supply-chain/purchase-orders`; `updateOrder(id, data)` — `PATCH /supply-chain/purchase-orders/{id}` (provider_id?, status?, payment_status?); `deleteOrder(id)` — `DELETE /supply-chain/purchase-orders/{id}`
- `addOrderItem(orderId, data)` — `POST /supply-chain/purchase-orders/{id}/items` (product_id, quantity, unit_cost, supplier_sku?); `updateOrderItem(orderId, itemId, data)` — `PUT /supply-chain/purchase-orders/{id}/items/{itemId}`; `deleteOrderItem(orderId, itemId)` — `DELETE /supply-chain/purchase-orders/{id}/items/{itemId}`

## OrderForm Page (`/orders/create` & `/orders/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Create mode:** 2-column layout. Breadcrumb `PED / Nuevo Pedido`. Product search (300ms debounce, pre-fills unit_cost from product.cost). Item cards with fields: Cantidad, Costo unit., SKU prov. (optional). Right panel: Resumen (item count + total) and Detalles (Proveedor required, Estado, Estado pago). Validation: provider required, at least one item, quantity > 0. Save via `POST /supply-chain/purchase-orders`.

**View/Edit mode:** Scoped edit states — `isEditingItems` and `isEditingDetails` (independent). Per-item controls: ✓ (PUT) + ✗ (DELETE). New items draft cards. Detalles editable: Proveedor, Estado, Estado pago via `PATCH`. CSS: `OrderForm.module.css` (copy of `SaleForm.module.css`) with `.emptyFieldValue` for null supplier_sku.

## Orders Page Layout (`/orders`)

**Breadcrumb:** `PED / Registro` | **No KPI strip**

**Filters:** Proveedor (debounced API), Estado pago (static: pending/paid), Estado (static: pending/sent/received/cancelled), Date range (native inputs)

**Table:** ID, Proveedor, Total, Fecha, Estado (badge), Pago (badge), Eye+Trash buttons | **Pagination:** `has_next`-based prev/next

## Providers Page Layout (`/providers`)

**Breadcrumb:** `PROV / Lista` | **Header:** Title "Proveedores" + button "Nuevo Proveedor"

**Search:** Debounced input (300ms) calls `providersApi.getProviders({ search, skip, limit })`

**Card Grid:** Responsive 1→2→3 columns. Cards show: name (semibold) + contact_info (optional), details (email, phone), Edit+Delete buttons (no View button)

**Modals:** CreateFormModal (name, contact_info, email, phone) + ConfirmDeleteModal

**Pagination:** Offset-based (previous/next), shows page number

**API:** Create `POST /supply-chain/providers`, Edit `PUT /supply-chain/providers/{id}`, Delete `DELETE /supply-chain/providers/{id}`

## Clients API Endpoints (`src/lib/api/clients.ts`)

- `getClients(params?)` — `GET /sales/clients` with search, skip, limit
- `createClient(data)` — `POST /sales/clients` (name required, identity_card/email/phone optional)
- `updateClient(id, data)` — `PUT /sales/clients/{id}`; `deleteClient(id)` — `DELETE /sales/clients/{id}`

## Clients Page Layout (`/clients`)

**Breadcrumb:** `CLI / Lista` | **Header:** Title "Clientes" + button "Nuevo Cliente"

**Search:** Debounced input (300ms) calls `clientsApi.getClients({ search, skip, limit })`

**Card Grid:** Responsive 1→2→3 columns. Cards show: name (semibold) + identity_card (optional), details (email, phone, created_date), Edit+Delete buttons (no View button)

**Modals:** CreateFormModal (name, identity_card, email, phone) + ConfirmDeleteModal

**Pagination:** Cursor-based (has_next), previous/next buttons

**API:** Create `POST /sales/clients`, Edit `PUT /sales/clients/{id}`, Delete `DELETE /sales/clients/{id}`

## Users Page Layout (`/users`)

**Access Control:** Protected by `SuperuserRoute` (redirect non-superusers to dashboard). Menu item hidden for non-superusers.

**Breadcrumb:** `USR / Gestión` | **Header:** Title "Usuarios" (24px, 700 weight) + button "Nuevo Usuario" (black bg, yellow hover)

**Search:** Debounced (300ms) calls `usersApi.getUsers({ search, skip, limit })`

**Table columns:** Usuario (avatar + name), Correo, Rol (badge: "Administrador" if is_superuser), Estado (toggle switch, green when active, calls updateUser immediately with spinner), Acciones (Edit + Delete buttons)

**Modals:**
- **Create:** full_name, email, password (required), role (select: Usuario/Administrador)
- **Edit:** full_name, email, password (optional, empty if unchanged), role (pre-selected)
- **Delete:** ConfirmDeleteModal with full_name

**Pagination:** Offset-based, shows page number, flex-end aligned, 1px top border

**API:** List `GET /users`, Create `POST /users`, Edit `PUT /users/{id}`, Delete `DELETE /users/{id}`, Toggle `PUT /users/{id}` with `{ is_active: boolean }`

## Inventory API Endpoints (`src/lib/api/inventory.ts`)

- `getProducts(params?)` — `GET /inventory/products` with pagination, search, filters; `getProduct(id)` — `GET /inventory/products/{id}`
- `createProduct(data)` — `POST /inventory/products`; `updateProduct(id, data)` — `PUT /inventory/products/{id}`; `deleteProduct(id)` — `DELETE /inventory/products/{id}`
- Filter dropdowns: `getCategories/getMaterials/getBrands/getMeasurementUnits(params?)` — `GET /inventory/[entity]` with search/skip/limit
- Create filter entities: `createCategory/createMaterial/createBrand/createMeasurementUnit(data)` — `POST /inventory/[entity]`
- `getStats()` — `GET /inventory/products/stats/overview` → total_variants, total_stock, low_stock_count, total_inventory_value

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
- **No logic or complex expressions inside JSX props:** Always extract into named variables or functions defined before the `return`. This applies to:
  - Event handlers with more than a single setter call → extract as `function handleXxx() {}`
  - `onSubmit`, `onCreated`, `onConfirm` callbacks with API calls → extract as `async function submitXxx()` / `function handleXxxCreated()`
  - Derived values computed inline in JSX → extract as `const xxxLabel = ...` or `const isXxx = ...`
  - Module-level constants for config arrays (e.g. field configs, column definitions) → define at module level, outside the component
  - ✅ OK inline: `onClick={() => setState(false)}`, `onChange={e => setValue(e.target.value)}`
  - ❌ Not OK inline: `onSubmit={async v => { const res = await api.call(...); return res.data }}` or multi-line `onCreated` handlers

## Assistant Rules

- **NEVER commit changes without explicit user permission:**
  - Make changes and let the user decide if/when to commit
  - Always ask before running `git commit`
  - This ensures the user maintains control over their repository history
- **ALWAYS create a plan BEFORE implementing any feature or significant change:**
  - Use `/brainstorming` skill to explore requirements and design
  - Present options and get user approval before writing code
  - Document the plan in comments before implementation
  - This prevents rework and ensures alignment on approach
- **ALWAYS update `CLAUDE.md` immediately after any breaking change or structural update — no exceptions:**
  - New pages, components, or directories added → update Project Structure + Routes
  - TypeScript type changes (new interfaces, renamed fields, updated shapes) → update TypeScript Types section
  - New or changed API endpoints → update the relevant API Endpoints section
  - New page documented behavior → add a dedicated section (e.g., "OrderForm Page")
  - Major component behavior changes → update or add the relevant section
  - New state management patterns, CSS modules, or styling conventions → document them
  - localStorage keys or persistent state changes → update Sidebar Behavior or relevant section
  - Route additions/removals → update Routes table
  - Dependencies added/removed/upgraded → update Tech Stack table
  - **This rule applies to every single task, not just "big" ones.** If you add a route, update the routes table. If you change a type, update the types section. If you add a page, document it. CLAUDE.md is the single source of truth — future sessions depend on it being accurate and complete.
  - **Update Section:** Identify which CLAUDE.md section(s) are affected, update them before finishing the task.
- **Use Tailwind CSS, CSS, and shadcn/ui** to develop and build out components. (This supersedes any previous instructions to avoid shadcn).
