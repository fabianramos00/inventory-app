# Design System

Complete visual and interaction design specification for GestiónStock.

## CSS Variables (`src/index.css`)

```css
--bg: #ffffff                /* sidebar, cards, UI elements */
--bg-page: #F3F4F6           /* main page background */
--surface: #ffffff           /* card backgrounds */
--surface-2: #F8FAFC         /* headers, hovers (slate-50) */
--border: #E5E7EB            /* slate-200 borders */
--border-strong: rgba(0,0,0,0.16)
--ink-1: #111111             /* primary text */
--ink-2: #555550             /* secondary text */
--ink-3: #9B9B8E             /* metadata, placeholder */
--accent: #FACC15            /* brand yellow — ONLY accent color */
--accent-hover: #EAB308
--accent-fg: #111111
--destructive: #DC2626       /* red — delete/error only */
--success: #16A34A
--warning: #D97706
--control-bg: #F8FAFC        /* input backgrounds (slate-50) */
--sidebar-w: 232px
```

## Typography

- **Headlines/UI/Body/Labels:** `Bricolage Grotesque` (geometric sans-serif)
- **Data/Codes/SKUs:** `DM Mono` (monospace, right-aligned)

## Utility Classes (`src/index.css`)

| Class | Purpose |
|---|---|
| `.bin-label` | Monospace tag badge (e.g. `INV / Productos`) |
| `.bin-label--accent` | Yellow variant |
| `.card` | Surface card with subtle shadow |
| `.badge--success/warning/destructive` | Sharp status chips |
| `.form-input` | Styled input (control-bg, yellow focus ring) |
| `.btn-primary` | Black bg, white text |
| `.btn-accent` | Yellow bg, black text |
| `.btn-ghost` | Transparent, border, ink-2 |
| `.data-table` | Industrial layout: right-aligned mono, tight borders |

## Core Design Rules

1. **One accent color only** — yellow `#FACC15`
2. **Structural borders (1px)** instead of soft shadows, except floating dropdowns
3. **Border radius:** 8px for pill controls/inputs, 12px for floating cards (command bar, table card)
4. **Active filter state:** Blue tint — `background: rgba(59,130,246,0.08); color: var(--accent); border-color: rgba(59,130,246,0.2)` (not accent left-border)
5. **Form controls:** Solid focus state with accent border + surface-2 background, no soft shadows
6. **Spacing:** Uses Tailwind defaults (4px grid)

## Command Bar / Table Layout Pattern

Applied consistently across all list pages (Inventory, Sales, Orders, Users, Providers, Clients):

- **`tableSection`** — `flex-direction: column; gap: 16px` (floating, not merged)
- **`commandBar`** — `border-radius: 12px; padding: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04)` — floats above table as separate card
- **`tableCard`** — `border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(0,0,0,0.04)` — full radius (not joined to command bar)
- **Search/filter pills inside command bar:** `height: 36px; border: 1px solid var(--border); border-radius: 8px` — border transparent on desktop (`@media min-width: 768px`), visible on mobile
- **Active filter pill:** Blue tint (see rule 4 above)

Full spec: `.interface-design/system.md`
