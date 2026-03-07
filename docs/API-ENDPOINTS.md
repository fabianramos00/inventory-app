# API Endpoints Documentation

All API modules are at `src/lib/api/`. Each module exports a named object with functions that use the configured Axios instance.

## Dashboard API (`src/lib/api/dashboard.ts`)

- `getSummary()` — `GET /dashboard/summary` → `{ inventory_value: number, total_sales_today: number, pending_orders: number, delivered_orders: number, pending_payment_sales: number }`
- `getSalesTrend()` — `GET /dashboard/sales-trend` → `{ data: [{ date: string (YYYY-MM-DD), sales_amount: number, orders_cost: number }, ...] }`
- `getTopProducts()` — `GET /dashboard/top-products` → `{ products: [{ product_id, product_name, product_sku, brand_name, category_name, material_name, total_quantity_sold, total_sales_amount }, ...] }`
- `getOrderStatusDistribution()` — `GET /dashboard/order-status-distribution` → `{ data: [{ status: string, count: number, percentage: number }, ...] }`

---

## Sales API (`src/lib/api/sales.ts`)

- `getSales(params?)` — `GET /sales` with filters: skip, limit, user_id, client_id, no_client, payment_method, delivery_status, payment_status, start_date, end_date
- `getSale(id)` — `GET /sales/{id}`
- `getSaleItems(id, params?)` — `GET /sales/{id}/items`
- `getClients(params?)` — `GET /sales/clients`; `createClient(data)` — `POST /sales/clients` (name required, identity_card/email/phone optional)
- `getStats()` — `GET /sales/stats` → unpaid_count, undelivered_count, total_amount_sum, amount_paid_sum
- `createSale(data)` — `POST /sales`; `updateSale(id, data)` — `PATCH /sales/{id}` (payment_method?, amount_paid?, client_id?); `deleteSale(id)` — `DELETE /sales/{id}`
- `addSaleItem(saleId, data)` — `POST /sales/{id}/items` (product_id, quantity, delivered_quantity, unit_price?); `updateSaleItem(saleId, itemId, data)` — `PUT /sales/{id}/items/{itemId}`; `deleteSaleItem(saleId, itemId)` — `DELETE /sales/{id}/items/{itemId}`

---

## Orders API (`src/lib/api/orders.ts`)

- `getOrders(params?)` — `GET /supply-chain/purchase-orders` with filters: skip, limit, provider_id, payment_status, status, min_date, max_date
- `getOrder(id)` — `GET /supply-chain/purchase-orders/{id}`; `getOrderItems(id, params?)` — `GET /supply-chain/purchase-orders/{id}/items`
- `createOrder(data: CreateOrderInput)` — `POST /supply-chain/purchase-orders`; `updateOrder(id, data)` — `PATCH /supply-chain/purchase-orders/{id}` (provider_id?, status?, payment_status?); `deleteOrder(id)` — `DELETE /supply-chain/purchase-orders/{id}`
- `addOrderItem(orderId, data)` — `POST /supply-chain/purchase-orders/{id}/items` (product_id, quantity, unit_cost, supplier_sku?); `updateOrderItem(orderId, itemId, data)` — `PUT /supply-chain/purchase-orders/{id}/items/{itemId}`; `deleteOrderItem(orderId, itemId)` — `DELETE /supply-chain/purchase-orders/{id}/items/{itemId}`

---

## Clients API (`src/lib/api/clients.ts`)

- `getClients(params?)` — `GET /sales/clients` with search, skip, limit
- `createClient(data)` — `POST /sales/clients` (name required, identity_card/email/phone optional)
- `updateClient(id, data)` — `PUT /sales/clients/{id}`; `deleteClient(id)` — `DELETE /sales/clients/{id}`

---

## Inventory API (`src/lib/api/inventory.ts`)

- `getProducts(params?)` — `GET /inventory/products` with pagination, search, filters; `getProduct(id)` — `GET /inventory/products/{id}`
- `createProduct(data)` — `POST /inventory/products`; `updateProduct(id, data)` — `PUT /inventory/products/{id}`; `deleteProduct(id)` — `DELETE /inventory/products/{id}`
- Filter dropdowns: `getCategories/getMaterials/getBrands/getMeasurementUnits(params?)` — `GET /inventory/[entity]` with search/skip/limit
- Create filter entities: `createCategory/createMaterial/createBrand/createMeasurementUnit(data)` — `POST /inventory/[entity]`
- `getStats()` — `GET /inventory/products/stats/overview` → total_variants, total_stock, low_stock_count, total_inventory_value

---

## Providers API (`src/lib/api/providers.ts`)

- `getProviders(params?)` — `GET /supply-chain/providers` with search, skip, limit
- `createProvider(data)` — `POST /supply-chain/providers` (name, contact_info optional, email, phone optional)
- `updateProvider(id, data)` — `PUT /supply-chain/providers/{id}`; `deleteProvider(id)` — `DELETE /supply-chain/providers/{id}`

---

## Users API (`src/lib/api/users.ts`)

- `getUsers(params?)` — `GET /users` with search, skip, limit
- `createUser(data)` — `POST /users` (full_name, email, password, is_superuser?)
- `updateUser(id, data)` — `PUT /users/{id}` (full_name?, email?, password?, is_active?, is_superuser?)
- `deleteUser(id)` — `DELETE /users/{id}`

---

## Auth API (`src/lib/api/auth.ts`)

- `login(email, password)` — `POST /auth/login` (form-urlencoded, returns `{ access_token, token_type, user }`)
- `logout()` — `POST /auth/logout`
- `me()` — `GET /auth/me` (returns current user)

---

## Axios Instance (`src/lib/axios.ts`)

- Configured with Bearer token from localStorage
- Request interceptor adds `Authorization: Bearer {token}` header
- Response interceptor handles 401: clears localStorage, redirects to `/login`
- All API modules use this configured instance automatically
- `withCredentials: false` (Bearer tokens don't use cookies)
