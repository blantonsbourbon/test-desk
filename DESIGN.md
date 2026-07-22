# Design system — Test Control Plane

Product-mode design language for the Angular console. Visual language is inspired by [TestDino](https://testdino.com) product chrome (light SaaS dashboard), adapted for dense BDD catalog / execution workflows.

## Aesthetic direction

**Light test-intelligence console.** Off-white canvas, pure white cards, soft gray borders, near-black primary actions, and tinted status chips. Prefer quiet density over decorative chrome. Borders + faint card shadow for hierarchy; stronger elevation only on dialogs/drawers/toasts.

Anti-references: dark cyber control rooms, teal-on-indigo gradients, purple SaaS gradients, Inter-only marketing heroes.

## Color tokens

Defined in `frontend/src/styles.scss`. Prefer tokens over hex in components.

| Token | Role |
|-------|------|
| `--bg` | App canvas (`#f5f6f7`) |
| `--sidebar` | Navigation rail (`#fafafa`) |
| `--surface-1` | Cards / panels (white) |
| `--surface-2` | Inset rows, hover, muted fill |
| `--border-subtle` / `--border-strong` | `#e8e8e8` / `#d4d4d4` |
| `--text` / `--text-muted` | Near-black / `#737373` |
| `--accent` | Near-black primary CTA (`#070707`) + white label |
| `--success` / `--success-bg` | Passed / synced (`#007e46` / soft green) |
| `--danger` / `--danger-bg` | Failed / error |
| `--warning` / `--warning-bg` | Queued / caution |
| `--running` / `--running-bg` | Running / syncing (cyan) |
| `--info` / `--info-bg` | Links and informational accents (blue) |
| `--table-header` | Warm off-white table head (`#fcfbf8`) |

### Status color rules

- Passed / synced → success green text on soft green chip + label
- Failed / error → danger red on soft red chip; ERROR copy must mention infrastructure when applicable
- Running / syncing → cyan chip with optional pulse dot
- Queued → amber chip
- Never run / cancelled / skipped → neutral muted chip
- Color is never the only channel (label always present)

## Typography

- **UI:** Geist (fallback Inter / system-ui)
- **IDs / paths / SHA / env:** Geist Mono (fallback JetBrains Mono)
- Base ~15px, line-height ~1.45
- Titles: ~1.5rem, weight 600, tight tracking
- Section labels: 0.72rem uppercase, letter-spacing 0.04em, muted, weight 600

## Spacing & layout

- 8px baseline
- Content max width ~1440px
- Sidebar ~15.5rem; collapses under 900px
- Radius base ~0.625rem (TestDino-like); controls slightly tighter
- Soft card shadow only; no glassmorphism

## Components

### Panels & tables

- White panels, 1px `#e8e8e8` border, light shadow
- Table headers on warm `--table-header`
- Row hover: surface-2 wash
- Status left rails on failed/passed/running/queued rows

### Buttons

- **Primary:** solid near-black, white text (TestDino primary pattern)
- Default: white + border
- Ghost: no border until hover fill
- Danger: soft red fill + danger text

### Chips & badges

- Soft tinted pills for status
- Tag chips neutral; active chip uses black border + soft fill

### Drawers & dialogs

- Light scrim, white surface, soft shadow
- Escape closes; submitting blocks cancel on run dialog

## Motion

- ≤160ms ease-out for drawer/dialog/toast
- Pulse only on live running indicators
- Honor `prefers-reduced-motion`

## Accessibility

- Icon-only controls need `aria-label`
- Focus ring uses neutral dark soft ring
- Keyboard paths for filters, env radios, drawers, run confirm
- Status never color-only

## What not to change casually

- Information architecture (Catalog / Executions / Sources)
- Domain copy from `CONTEXT.md` / `docs/frontend-design.md`
- Environment model (`dev` | `qa` only, no default)
- Pin-to-revision semantics
