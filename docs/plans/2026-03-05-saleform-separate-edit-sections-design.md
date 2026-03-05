# SaleForm: Separate Edit Sections

**Date:** 2026-03-05

## Problem

The current edit UX has a single "Editar"/"Guardar" toggle in the page header that activates both item editing and sale details editing simultaneously. However, "Guardar" only saves sale-level data (client, payment method, amount paid) — items are saved individually via per-item checkmark buttons. This is confusing because the scope of "Guardar" is not obvious.

## Design

Remove the global edit mode. Replace it with two independent scoped edit modes: one for the Productos card and one for the Detalles de Venta card.

### Page header

Remove the global "Editar", "Guardar", and "Cancelar" buttons. Keep only the "Eliminar" button (which opens `ConfirmDeleteModal`).

### Productos card

Add an "Editar" button to the card header (right side).

- **View mode:** Items render read-only. "Editar" button visible.
- **Edit mode:** "Editar" is replaced by a "Cancelar" button. Product search field appears at top of card. Each item shows editable inputs with its own ✓ (save) and ✗ (delete) buttons. Per-item saves continue to call `PUT /sales/:id/items/:itemId` individually, same as today. No card-level "Guardar" button needed.

### Detalles de Venta card

Add an "Editar" button to the card header (right side).

- **View mode:** Cliente, Estado pago, Estado entrega, Método pago, Monto pagado, Registrado por, Fecha rendered read-only.
- **Edit mode:** "Editar" is replaced by "Guardar" and "Cancelar" buttons in the card header. Cliente, Método pago, and Monto pagado become editable inputs. Saving calls `PATCH /sales/:id` same as today.

### Resumen card

No change. Total and Deuda continue to compute live from whichever card is in edit mode.

### State changes

Replace the single `isEditing: boolean` with two independent booleans:
- `isEditingItems: boolean`
- `isEditingDetails: boolean`

Both can be active simultaneously. All existing state (`editingItems`, `pendingItems`, `editPaymentMethod`, `editAmountPaid`, `editClientId`, etc.) remains unchanged — it is only activated/reset by its respective card's edit toggle.
