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
3. **Border radius:** 4px max for controls, 10px for top-level containers
4. **Active states:** Sharp `3px` left-border with accent color
5. **Form controls:** Solid focus state with accent border + surface-2 background, no soft shadows
6. **Spacing:** Uses Tailwind defaults (4px grid)

Full spec: `.interface-design/system.md`
