# GestiónStock — Project Context

Inventory management SPA for an ironmongery/hardware store ("ferretería"). Built in TypeScript React. All UI text is in **Spanish**.

## 📋 Documentation Structure (Compact-First Rule)

**CLAUDE.md contains only essential info:** Tech stack, critical setup, routes, key patterns, conventions, code rules.

**Detailed docs in separate files:**
- `docs/PAGES.md` — Page layouts (Dashboard, Inventory, Sales, Orders, Clients, Users, Providers)
- `docs/API-ENDPOINTS.md` — Full API endpoint documentation
- `docs/COMPONENTS.md` — Reusable component specs (Dropdown, ProductDropdown, CreateFormModal, etc.)
- `docs/DESIGN-SYSTEM.md` — Typography, colors, spacing, component styles
- `docs/TYPES.md` — TypeScript interfaces and types

**Rule:** Keep CLAUDE.md under 250 lines. Link to detailed docs. Only update CLAUDE.md for:
- Tech stack changes
- Critical route additions/removals
- New authentication patterns
- Global state management changes
- Breaking changes to established conventions

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
├── App.tsx, main.tsx, index.css, types/index.ts
├── context/ → AuthContext, UIContext, ModalContext
├── components/
│   ├── PrivateRoute, Dropdown, ProductDropdown
│   ├── CreateEntityModal, ConfirmDeleteModal, CreateFormModal
│   ├── DataTable/ → loading/empty/overflow/pagination wrapper for all list tables
│   ├── PageHeader, CommandBar, DataCard, Pagination
│   ├── AttributeTab/ → generic catalog attribute CRUD tab
│   └── layout/ → AppLayout, Sidebar
├── lib/
│   ├── axios.ts (Bearer token interceptor)
│   ├── utils.ts (cn helper)
│   └── api/ → auth, dashboard, inventory, providers, clients, sales, orders, users
└── pages/ → Login, Dashboard, Inventory, ProductForm, Sales, SaleForm, Orders, OrderForm, Providers, Clients, Users
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

📄 **See `docs/DESIGN-SYSTEM.md` for complete design specifications:**
- CSS variables, typography, utility classes, design rules
- Full spec at `.interface-design/system.md`

**Quick reference:** Yellow accent `#FACC15`, 1px borders, 4px radius on controls, Bricolage Grotesque for UI, DM Mono for data.

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

## Pages & Layouts

📄 **See `docs/PAGES.md` for detailed page specifications:**
- Dashboard, Inventory, Product Form
- Sales & Orders pages and forms
- Clients, Providers, Users pages

All pages use consistent layout patterns: breadcrumb, header with title, optional KPI strip, content area with cards/tables, per-section error handling with Spanish messages.

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

## TypeScript Types

📄 **See `docs/TYPES.md` for full type definitions:**
- All interfaces at `src/types/index.ts`: User, Product, Category, Sale, Order, Client, Provider, etc.
- Pagination: `PaginatedResponse<T>`, `CursorPaginatedResponse<T>`

## API Endpoints

📄 **See `docs/API-ENDPOINTS.md` for full API documentation:**
- Dashboard, Sales, Orders, Clients, Inventory, Providers, Users, Auth
- Each module exports named functions (e.g. `export const dashboardApi = { ... }`)
- All use configured Axios instance with Bearer token

## Path Alias

`@/` maps to `src/` — configured in both `vite.config.ts` and `tsconfig.app.json`.

## Code Conventions

- `.tsx` components with default exports (pages: `src/pages/[PageName]/[PageName].tsx`)
- Pages use CSS Modules (`[PageName].module.css`) — no inline styles
- API modules: named exports (e.g. `export const dashboardApi = { ... }`)
- CSS: only use `var(--token-name)`, never raw hex values
- Text: Spanish throughout (Guardar, Cancelar, Editar, Ver)
- Dates: `DD/MM/YYYY` | Currency: `$ X,XXX.XX` (Peruvian Sol)
- Mobile-responsive with Tailwind breakpoints; wrap tables in `overflow-x-auto`
- **Comments:** Explain WHY, not WHAT. Self-documenting code > comments
- **No complex JSX props:** Extract logic to named functions/variables before `return`
  - ✅ `onClick={() => setState(false)}`
  - ❌ `onSubmit={async v => { const res = await api.call(...); return res.data }}`

## Rules for Developers

1. **Never auto-commit:** Always ask before `git commit`
2. **Plan before code:** Use `/brainstorming` for significant changes
3. **Keep CLAUDE.md compact:** Update only core changes (routes, tech stack, critical patterns). Link to detailed docs in `docs/`
4. **Update docs on changes:** Routes → update Routes table; major behavior → update relevant section or link to detailed docs
5. **Use Tailwind + CSS Modules + shadcn/ui** for all components
