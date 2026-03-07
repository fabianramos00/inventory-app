# Page Layouts Documentation

Detailed specifications for each page in GestiónStock. See CLAUDE.md for navigation routes and global patterns.

## Dashboard Page (`/`)

**Breadcrumb:** `DSH / Resumen` | **Header:** Title "Dashboard"

**KPI Strip:** 4 cards loaded from `dashboardApi.getSummary()` on mount:
1. Valor Total Inventario (inventory_value)
2. Ingresos de Hoy (total_sales_today)
3. Pedidos Pendientes (pending_orders)
4. Ventas Sin Pagar (pending_payment_sales)
- Currency formatting: `$ X,XXX.XX` (es-PE locale)
- Icons: Package, DollarSign, ClipboardList, ShoppingCart
- 1px dividers between items

**Charts Row:** 3 responsive chart cards
1. **Line Chart (Ventas y Pedidos — Últimos 7 Días)** — Data from `dashboardApi.getSalesTrend()`, transforms date strings to Spanish day names (Lun, Mar, Mié, etc.)
   - Data keys: ventas (sales_amount), pedidos (orders_cost)
   - Colors: success (green) for ventas, warning (orange) for pedidos
2. **Horizontal Bar Chart (Top Productos Vendidos)** — Data from `dashboardApi.getTopProducts()`, maps product_name → name, total_quantity_sold → ventas
   - Color: accent yellow
3. **Pie Chart (Estado de Pedidos)** — Data from `dashboardApi.getOrderStatusDistribution()`, maps status strings to Spanish names and colors
   - Status mapping: pending → Pendiente (warning), sent → Enviado (blue), received → Recibido (success), cancelled → Cancelado (ink-3)
   - Donut style: innerRadius 60, outerRadius 90

**Tables Row:** 2 cards
1. **Actividad Reciente** — Hardcoded mock data (no API endpoint yet)
2. **Stock Bajo** — Data from `inventoryApi.getProducts({ skip: 0, limit: 10, stock_status: 'low_stock' })`, maps fields: name, sku, stock_quantity → stock, low_stock_threshold → min, measurement_unit?.name → unit

**Error & Empty State Handling:** Each section handles errors independently:
- If data fails to load: Shows error message (e.g., "Error al cargar tendencia de ventas")
- If data is empty: Shows appropriate message (e.g., "Sin productos vendidos", "Todos los productos tienen stock suficiente")

---

## Inventory Page (`/inventory`)

**Breadcrumb:** `INV / Productos` (DM Mono, 11px) | **Header:** Title "Inventario Principal" + button "Nuevo Producto" (black bg, yellow hover)

**KPI Strip:** Loads via `inventoryApi.getStats()` on mount — 4 cards: total_variants, total_stock, low_stock_count, total_inventory_value. 1px dividers, DM Mono values.

**Filters:** Name/ID search (icon input), Category/Material/Marca dropdowns (dynamic, load on open), Disponibilidad (static: Todos/En Stock/Stock Bajo/Sin Stock). Active state: accent bottom border.

**Table:** Product list with right-aligned numeric columns (Stock, Mín., Price), subtle row borders, status badges. Pagination: previous/next buttons with page number.

**API params:** skip, limit, search, category_id, material_id, brand_id, stock_status

---

## Product Form Page (`/inventory/create` & `/inventory/product/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Breadcrumb:** `INV / Registro` or `INV / Producto`

**Layout:** 3 cards: Información General, Valores Económicos, Control de Stock. 4px borders, minimal shadow.

**Controls:** Text inputs (4px radius, solid borders), focus state: surface-2 background + accent border. Numeric fields (Price, Cost, Size, Stock): DM Mono, right-aligned.

**Features:** Product/Category/Material/Brand/Unit dropdowns (with "Agregar nuevo" buttons open CreateEntityModal). Image upload/preview. Save/Cancel/Edit/Delete buttons (block-level, 4px radius).

---

## Sales Page (`/sales`)

**Breadcrumb:** `VNT / Registro` | **KPI Strip:** Total ventas, Total cobrado, Sin pagar, Sin entregar (loads from `salesApi.getStats()`)

**Filters:** Usuario (debounced API), Cliente (debounced API + "Sin cliente" option), Método pago (static), Entrega (static), Estado pago (static), Date range (native inputs)

**Table:** Código, Cliente, Total, Pagado, Deuda, Pago (badge), Entrega (badge), Usuario, Fecha, Eye+Trash buttons | **Pagination:** `has_next`-based prev/next

---

## SaleForm Page (`/sales/create` & `/sales/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Create mode:** 2-column layout (items left, summary+details right). Breadcrumb `VNT / Nueva Venta`. Debounced product search (300ms), item cards with yellow left-border, fields: Cantidad, Cant. entregada, Precio unit. Right panel has Resumen card (item count + total) and Detalles card (Cliente dropdown + payment fields). Live validation on delivered_quantity and amount_paid. Save via `POST /sales`.

**View/Edit mode:** Two independent scoped edit states — `isEditingItems` (product search + per-item controls) and `isEditingDetails` (Cliente, Método pago, Monto pagado). Per-item controls: ✓ (PUT) + ✗ (DELETE) with spinners. New items draft cards (POST on ✓). Live validation per item. Resumen updates live. Debt = `total − amount_paid`. Delete button opens `ConfirmDeleteModal`.

**Dropdowns:** Custom pattern in SaleForm.module.css with `border: 1px solid var(--border-strong)`, `height: 40px`, active state: `box-shadow: inset 0 -2px 0 var(--accent)`.

---

## Orders Page (`/orders`)

**Breadcrumb:** `PED / Registro` | **No KPI strip**

**Filters:** Proveedor (debounced API), Estado pago (static: pending/paid), Estado (static: pending/sent/received/cancelled), Date range (native inputs)

**Table:** ID, Proveedor, Total, Fecha, Estado (badge), Pago (badge), Eye+Trash buttons | **Pagination:** `has_next`-based prev/next

---

## OrderForm Page (`/orders/create` & `/orders/:id`)

Mode detection: `const isCreateMode = !useParams().id`

**Create mode:** 2-column layout. Breadcrumb `PED / Nuevo Pedido`. Product search (300ms debounce, pre-fills unit_cost from product.cost). Item cards with fields: Cantidad, Costo unit., SKU prov. (optional). Right panel: Resumen (item count + total) and Detalles (Proveedor required, Estado, Estado pago). Validation: provider required, at least one item, quantity > 0. Save via `POST /supply-chain/purchase-orders`.

**View/Edit mode:** Scoped edit states — `isEditingItems` and `isEditingDetails` (independent). Per-item controls: ✓ (PUT) + ✗ (DELETE). New items draft cards. Detalles editable: Proveedor, Estado, Estado pago via `PATCH`. CSS: `OrderForm.module.css` (copy of `SaleForm.module.css`) with `.emptyFieldValue` for null supplier_sku.

---

## Providers Page (`/providers`)

**Breadcrumb:** `PROV / Lista` | **Header:** Title "Proveedores" + button "Nuevo Proveedor"

**Search:** Debounced input (300ms) calls `providersApi.getProviders({ search, skip, limit })`

**Card Grid:** Responsive 1→2→3 columns. Cards show: name (semibold) + contact_info (optional), details (email, phone), Edit+Delete buttons (no View button)

**Modals:** CreateFormModal (name, contact_info, email, phone) + ConfirmDeleteModal

**Pagination:** Offset-based (previous/next), shows page number

**API:** Create `POST /supply-chain/providers`, Edit `PUT /supply-chain/providers/{id}`, Delete `DELETE /supply-chain/providers/{id}`

---

## Clients Page (`/clients`)

**Breadcrumb:** `CLI / Lista` | **Header:** Title "Clientes" + button "Nuevo Cliente"

**Search:** Debounced input (300ms) calls `clientsApi.getClients({ search, skip, limit })`

**Card Grid:** Responsive 1→2→3 columns. Cards show: name (semibold) + identity_card (optional), details (email, phone, created_date), Edit+Delete buttons (no View button)

**Modals:** CreateFormModal (name, identity_card, email, phone) + ConfirmDeleteModal

**Pagination:** Cursor-based (has_next), previous/next buttons

**API:** Create `POST /sales/clients`, Edit `PUT /sales/clients/{id}`, Delete `DELETE /sales/clients/{id}`

---

## Users Page (`/users`)

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
