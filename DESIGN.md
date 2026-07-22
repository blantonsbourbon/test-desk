# Design system — Test Control Plane

Product-mode design language for the Angular console. Align implementation with this file and `docs/frontend-design.md`.

## Aesthetic direction

**Control room for BDD ops.** Dark indigo-black surfaces, teal accent, coral failure, amber warning. Borders over shadows. High information density, fast horizontal scan of tables and badges.

## Color tokens

Use CSS variables from `frontend/src/styles.scss`. Prefer tokens over hex literals in components.

| Token | Role |
|-------|------|
| `--bg` | App background (tinted near-black indigo) |
| `--surface-1` | Primary panels / cards |
| `--surface-2` | Inset controls, secondary panels |
| `--border-subtle` / `--border-strong` | Dividers and emphasis borders |
| `--text` / `--text-muted` | Body and secondary |
| `--accent` / `--success` | Teal — primary action + pass |
| `--danger` | Coral — fail / error |
| `--warning` | Amber — queued / caution |
| `--focus-ring` | Keyboard focus outline |
| `--overlay` | Modal/drawer scrim |
| `--shadow-drawer` / `--shadow-dialog` | Elevation only for overlays |

Tinted neutrals only — no pure `#000` / `#fff` as large surfaces.

### Status color rules

- Passed / synced → success teal + text label + icon
- Failed / error → danger coral (ERROR copy must mention infrastructure when applicable)
- Running / syncing → accent teal, subtle live treatment
- Queued → warning amber
- Never run / cancelled / skipped → muted neutral

## Typography

- **UI:** IBM Plex Sans (400–700)
- **IDs / paths / SHA / env:** IBM Plex Mono
- Base ~15px, line-height ~1.45
- Page titles: ~1.5–1.55rem, slight negative tracking
- Section labels: 0.72rem uppercase, letter-spacing 0.04em, muted

## Spacing & layout

- **8px baseline** (0.25rem steps)
- Content max width ~1440px, centered
- Sidebar ~16rem fixed; collapses to drawer under 900px
- Radius: controls ~0.45rem, panels ~0.65rem, pills full round
- Prefer border + background shift for hierarchy; reserve heavy shadow for dialogs/drawers/toasts

## Components

### Panels & tables

- `.panel` — bordered surface-1 container
- Dense grid tables with uppercase muted headers
- Row hover: low-opacity accent wash
- Active/running rows: slightly stronger accent wash + optional status rail
- Failed scenario rows may use a thin danger left rail (with badge still required)

### Buttons

- Primary: accent-tinted fill + border
- Ghost: transparent, border on hover
- Danger: coral-tinted
- Min height ~2.35rem (sm ~2rem); disabled opacity ~0.55

### Chips & badges

- Chips for tags/filters; active chip uses accent tint
- Status badges: pill + icon + label (never color alone)

### Drawers & dialogs

- Drawer: right edge, border-left, soft shadow, Escape closes
- Dialog: centered, stronger scrim, Escape closes without submit while submitting is blocked
- Focus moves into dialog; do not trap after close

### Empty / error states

- Empty: short explanation + one clear action (clear filters / open catalog / sync)
- Error banner: danger tint + Retry (or equivalent) always available

## Motion

- Short only (≤180ms): drawer slide, toast enter, sidebar
- Honor `prefers-reduced-motion`
- No bounce/elastic easing
- Live “Refreshing…” for polling — not decorative spinners everywhere

## Iconography

Prefer compact inline SVG (stroke or solid, 16–18px) over ad-hoc Unicode where chrome is permanent (nav, run, close). Decorative marks stay muted; interactive icons inherit text color.

## Accessibility

- Icon-only buttons require `aria-label`
- Focus-visible rings use `--focus-ring` with offset
- Keyboard: filters, env radios, drawers, run confirm
- Status never conveyed by color alone
- Dialogs: `role="dialog"`, `aria-modal`, labelled title

## What not to change casually

- Information architecture (Catalog / Executions / Sources)
- Domain copy from `CONTEXT.md` / `docs/frontend-design.md`
- Environment model (`dev` | `qa` only, no default)
- Execution pinned to catalog revision semantics
