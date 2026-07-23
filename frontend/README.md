# Test Desk — Frontend

Angular 19 console for the BDD **Test Catalog** and **Test Execution** APIs.

See [../docs/frontend-design.md](../docs/frontend-design.md) for product behavior and API contracts.

## Requirements

- Node.js 20+
- Backend running on `http://localhost:8080` (or set `apiBaseUrl`)

## Run

```bash
npm install
npm start
```

Dev server: `http://localhost:4200`

- API calls go to `http://localhost:8080/api/v1` (see `src/environments/environment.ts`).
- Optional proxy: `proxy.conf.json` maps `/api` → backend if you switch the env URL to relative `/api/v1`.

## Build

```bash
npm run build
```

Output: `dist/frontend/`

## Pages

| Route | Purpose |
| --- | --- |
| `/catalog` | Feature-grouped scenarios, filters, sync, run |
| `/executions` | Execution history (active runs pinned first) |
| `/executions/:id` | Execution detail, cancel, polling |
| `/sources` | Git test sources (read-only) |
