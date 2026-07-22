# Product context — Test Control Plane

## Mode

**Product mode** (internal app UI / control room). Not brand/marketing.

## What it is

Company-internal console for discovering BDD test definitions from Git, launching executions against `dev` or `qa`, and observing results. Teams use it daily for scanning catalogs and run status — not for authoring features or configuring runners.

## Audience

- QA engineers and developers who know Gherkin terminology (Feature, Scenario, Outline).
- Platform operators who verify source sync health.
- Users scan dense tables and status badges under time pressure.

## Product principles

1. **Git is source of truth** — catalog is read-only; never imply edit/authoring.
2. **Pin every run to a commit** — revision is always visible at decision points.
3. **Environment is explicit** — never default or hide `dev` / `qa`.
4. **Status is multi-channel** — color + label + icon; never color alone.
5. **Infrastructure errors ≠ test failures** — call out ERROR clearly.
6. **Density over decoration** — control-room scan speed beats marketing whitespace.
7. **Every error has a next step** — retry, clear filters, open catalog, etc.

## Surfaces

| Surface | Job |
|---------|-----|
| Catalog | Browse features/scenarios, filter, multi-select, open detail, run |
| Scenario detail drawer | Steps, latest result, recent executions, run |
| Run dialog | Confirm scenarios, pinned revision, pick environment |
| Executions list | Filter history; active runs visually elevated |
| Execution detail | Summary + per-scenario results; cancel if active |
| Sources | Sync health cards; open catalog for a source |

## Voice

Concise, operational English. Prefer “Sync source”, “Run in qa”, “Never run” over marketing fluff. Technical IDs (SHA, paths, execution IDs) use monospace.

## Anti-references

- SaaS marketing landing pages, hero sections, Inter/purple-blue gradients
- Nested cards-in-cards, large empty whitespace, bounce/elastic motion
- Pure black/white without tint, gray text on colored backgrounds
- Character soup as the only icon system (prefer consistent SVG marks)
- “AI dashboard” glassmorphism or neon cyberpunk chrome
