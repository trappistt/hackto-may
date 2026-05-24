# Backend build plan

Architecture and phased delivery for **hackto-may** ([github.com/trappistt/hackto-may](https://github.com/trappistt/hackto-may)).

The **backend owns all numbers** (interest, rankings, balances). **Backboard** owns coach chat; **ElevenLabs** (Phase 3) will own voice. The **frontend** (`frontend/`) is a thin client over `/api/*` only.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **0** — Domain + REST API | ✅ Done | Black-hole engine, mock personas, all P0 routes |
| **1** — SQLite persistence | ✅ Done | Users, accounts, goals survive restart |
| **1b** — Backboard coach | ✅ Done | `backboard.js` + `coachTools.js`; tool loop; `coach_sessions` |
| **2** — Frontend | ✅ Done | Vite + React in `frontend/`; report + coach chat; CORS + proxy |
| **3** — ElevenLabs | ⏳ Not started | |

**You are here:** Phase **3** — ElevenLabs voice + demo polish.

**First-time setup:**

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env    # add BACKBOARD_* for coach chat
npm run dev:all         # http://localhost:5173
```

**Commands:**

| Command | Description |
|---------|-------------|
| `npm run dev:all` | API `:3001` + UI `:5173` |
| `npm run dev` | API only |
| `npm run dev:web` | UI only (Vite proxies `/api` → `:3001`) |
| `npm test` | 6 backend unit tests |
| `npm run build:web` | Production build → `frontend/dist/` |
| `npm run backboard:check` | Verify Backboard key + assistant (direct API, not `/coach/message`) |

---

## Full stack

| Layer | Technology | Location |
|-------|------------|----------|
| **UI** | React 19, Vite 6, custom CSS | `frontend/` |
| **API** | Node.js, Express 5, JavaScript (ESM) | `backend/src/app.js` |
| **Domain** | Pure JS modules (no I/O in engine) | `backend/src/services/` |
| **Persistence** | SQLite via `better-sqlite3` | `backend/data/app.db` |
| **Mock bank data** | JSON personas | `backend/data/sampleClients.json` |
| **Coach** | Backboard REST (`/threads/messages`, tool loop) | `backend/src/services/backboard.js` |
| **Voice** (planned) | ElevenLabs | Phase 3 |
| **Config** | dotenv, repo-root `.env` | `backend/src/loadEnv.js` |
| **Dev** | `concurrently`, Vite proxy, CORS | root `package.json`, `frontend/vite.config.js` |

**Intentionally not in stack (for now):** Next.js, TypeScript, OAuth, live bank APIs (Flinks/Plaid stub only).

**Optional later:** [shadcn/ui](https://ui.shadcn.com/) + Tailwind in `frontend/` only (UI polish; backend unchanged).

---

## Product slice (demo-critical)

| Priority | Capability | Status |
|----------|------------|--------|
| P0 | Unified profile | ✅ `GET /profile` |
| P0 | Interest Black Hole Report | ✅ `GET /black-holes` + UI card |
| P0 | Payoff recommendation | ✅ in black-hole `recommendation` field |
| P0 | Credit utilization | ✅ `GET /utilization` |
| P1 | User + onboarding (persona, tone, stress) | ✅ SQLite `users` + demo setup UI |
| P1 | Coach proxy (Backboard + tools) | ✅ API + chat panel |
| P2 | Year-round tax nudge | ⏳ |
| P2 | Spend flags, bank package | ⏳ |

**Demo path (UI):** open http://localhost:5173 → pick persona (alex / sam / jordan) → view Black Hole Report → ask coach

**Demo path (API):** `POST /users` → `POST /accounts/mock` → `GET /black-holes` → `POST /coach/message`

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  frontend/ (Vite + React) — :5173                           │
│  • DemoSetup, BlackHoleReport, CoachChat                    │
│  • localStorage user id · Vite proxy /api → :3001           │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP /api/*
┌────────────────────────────▼────────────────────────────────┐
│  HTTP API (Express) — backend/src/app.js                    │
│  • CORS: FRONTEND_ORIGIN (default http://localhost:5173)    │
│  • Auth: none (opaque user UUID)                            │
│  • Boot: loadEnv.js → config → app (see below)              │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
┌────────────▼────────────┐     ┌────────────▼──────────────────┐
│  Domain services        │     │  Integrations                 │
│  • blackHoleEngine.js   │     │  • backboard.js ✅            │
│  • utilization.js       │     │  • coachTools.js ✅           │
│  • coachTools (local)   │     │  • elevenlabs.js (Phase 3)  │
└────────────┬────────────┘     └───────────────────────────────┘
             │
┌────────────▼────────────┐
│  adapters/              │
│  • mockClient.js ✅      │
│  • apiClient.js (stub)  │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  SQLite — db/store.js   │
│  • users, user_accounts │
│  • goals, coach_sessions│
│  + sampleClients.json   │
└─────────────────────────┘
```

**Rule:** LLMs never compute interest, rankings, or balances. They call tools that hit our domain layer (same logic as REST).

### Boot order (`backend/src/index.js`)

1. `import "./loadEnv.js"` — loads repo-root `.env` with **`override: true`**
2. `config.js` — reads `process.env` (getters for Backboard keys)
3. `app.js` — routes
4. On listen: logs env file path + `Backboard: configured` or troubleshooting hint

---

## Repo layout

```text
hackto-may/
├── docs/
│   ├── BACKEND.md
│   └── research/
├── frontend/
│   ├── src/
│   │   ├── App.jsx, App.css, api.js, main.jsx
│   │   └── components/
│   │       ├── DemoSetup.jsx
│   │       ├── BlackHoleReport.jsx
│   │       └── CoachChat.jsx
│   ├── vite.config.js      # proxy /api → :3001
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.js        # entry: loadEnv → config → app
│   │   ├── loadEnv.js      # dotenv from repo root (override: true)
│   │   ├── config.js       # port, paths, isBackboardConfigured()
│   │   ├── env.js          # deprecated shim → loadEnv
│   │   ├── app.js
│   │   ├── adapters/
│   │   ├── services/
│   │   │   ├── blackHoleEngine.js
│   │   │   ├── utilization.js
│   │   │   ├── backboard.js
│   │   │   └── coachTools.js
│   │   └── db/
│   ├── scripts/check-backboard.js
│   └── data/sampleClients.json
├── package.json
├── .env.example
└── README.md
```

---

## API contract (v0)

Base: `http://localhost:3001/api` (or proxied at `http://localhost:5173/api` in dev)

### Implemented ✅

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/health` | `{ ok, service, persistence: "sqlite" }` |
| `POST` | `/users` | `{ persona?, tone?, stressTopics? }` |
| `GET` | `/users/:id` | |
| `PATCH` | `/users/:id` | `{ persona?, tone?, stressTopics? }` |
| `POST` | `/users/:id/accounts/mock` | `{ personaKey?: "alex" \| "sam" \| "jordan" }` |
| `GET` | `/users/:id/profile` | unified snapshot + disclaimer |
| `GET` | `/users/:id/black-holes` | **hero report** |
| `GET` | `/users/:id/utilization` | per-card + aggregate |
| `POST` | `/users/:id/goals` | persisted |
| `GET` | `/users/:id/goals` | |
| `POST` | `/users/:id/coach/message` | `{ content }` → `{ reply, threadId, disclaimer }` |

`persona` (user record): `career_professional` | `high_loan` | `recovering`  
`tone`: `coach` | `companion` | `chief_of_staff`  
`personaKey` (mock seed): `alex` | `sam` | `jordan`

### Backboard tools (coach)

Executed locally in `coachTools.js` (same data as REST):

| Tool | Maps to |
|------|---------|
| `get_unified_profile` | Profile snapshot |
| `scan_interest_black_holes` | `buildBlackHoleReport()` |
| `recommend_payoff_action` | `recommendation` + top ranked row |

### Coach flow (`backboard.js`)

1. `POST https://app.backboard.io/api/threads/messages` with `assistant_id`, `tools`, optional `thread_id`
2. While `status === REQUIRES_ACTION"`, run `coachTools` and `POST /threads/tool-outputs`
3. Persist `thread_id` in `coach_sessions` per user

---

## Core domain: Interest Black Hole Report

Implemented in `backend/src/services/blackHoleEngine.js`.

**Per liability:** monthly interest, utilization, months at minimum payment, flags (`high_utilization`, `minimum_payment_trap`, `promo_apr_expiring_soon`), `blackHoleScore`.

**Output:** `totalMonthlyInterestBurn`, `ranked[]`, `recommendation` (extra payment + 90-day interest saved), `disclaimer`.

---

## Persistence (SQLite)

| Table | Used |
|-------|------|
| `users` | ✅ |
| `user_accounts` | ✅ |
| `goals` | ✅ |
| `coach_sessions` | ✅ `backboard_thread_id` per user |

DB path: `DATABASE_PATH` (default `./backend/data/app.db`). Schema in `backend/src/db/schema.sql`.

---

## Build phases (order of work)

### Phase 0 — Domain without integrations ✅

**Exit criteria:** met — `GET /api/users/:id/black-holes` returns ranked report.

### Phase 1 — Persistence & goals ✅

**Exit criteria:** met — data survives server restart.

### Phase 1b — Backboard ✅

| Step | Status |
|------|--------|
| `BACKBOARD_API_KEY` + `BACKBOARD_ASSISTANT_ID` in `.env` | ✅ |
| `loadEnv.js` — dotenv with `override: true` | ✅ |
| `backboard.js` + `coachTools.js` + tool loop | ✅ |
| `POST /coach/message` + `coach_sessions` | ✅ |
| Startup log: `Backboard: configured` / troubleshooting | ✅ |
| Upload research doc to assistant (optional) | ⏳ |

**Exit criteria:** met — coach answers grounded in tool JSON (e.g. RBC Visa ~$95.29/mo for alex).

### Phase 2 — Frontend ✅

| Step | Status |
|------|--------|
| `frontend/` Vite + React | ✅ |
| CORS in `app.js` (`FRONTEND_ORIGIN`) | ✅ |
| Vite dev proxy `/api` → `:3001` | ✅ |
| Black Hole Report card | ✅ |
| Coach chat → `POST /coach/message` | ✅ |
| Demo onboarding (persona + tone) | ✅ |
| `localStorage` user id + “New demo” reset | ✅ |
| Coach 501 fallback message in UI when Backboard off | ✅ |

**Exit criteria:** met — full demo in browser without `curl`.

### Phase 3 — ElevenLabs + demo polish

1. Webhook tool endpoints for ConvAI
2. Voice summary of top black hole
3. Run `eval/scenarios.yaml` manually or in CI
4. (Optional) shadcn/ui + Tailwind in `frontend/`

---

## Environment variables

```env
API_PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_PATH=./backend/data/app.db
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=
ELEVENLABS_API_KEY=
```

Copy `.env.example` → `.env`. Loaded from **repo root** by `backend/src/loadEnv.js` (`override: true`).

After editing `.env`, **restart** the API. On startup you should see:

```text
Env file: /path/to/hackto-may/.env (found)
Backboard: configured (coach enabled)
```

### Troubleshooting: “Backboard not configured”

If `.env` looks correct but startup says **not configured** (or the UI shows the coach fallback):

1. **Save** `.env` and **restart** `npm run dev:all`.
2. **Stale shell exports** — if you ran `set -a && source .env` when keys were still empty, your terminal may export `BACKBOARD_API_KEY=""`. dotenv’s default is to skip already-set vars; we use **`override: true`** in `loadEnv.js` so file values win. If problems persist, open a **new terminal** or:
   ```bash
   unset BACKBOARD_API_KEY BACKBOARD_ASSISTANT_ID
   npm run dev:all
   ```
3. Confirm variable **names** match exactly (no typos, no spaces around `=`).
4. Run `npm run backboard:check` to verify keys against Backboard directly.

| Variable | Where to get it |
|----------|-----------------|
| `BACKBOARD_API_KEY` | [Backboard dashboard](https://app.backboard.io) → API keys |
| `BACKBOARD_ASSISTANT_ID` | Dashboard assistant id, or create via API / `backboard:check` |

Frontend optional: `frontend/.env` with `VITE_API_URL=http://localhost:3001` if not using the Vite proxy.

---

## Compliance

- ✅ Financial responses include `disclaimer` string (API + UI)
- Backboard assistant `system_prompt`: non-judgmental, call tools for numbers, not licensed advice
- `guardrails.js` — later

---

## Success metrics

- [x] Black hole report for 3 personas returns different rankings
- [x] Math covered by unit tests (`blackHoleEngine.test.js`, `store.test.js`, `coachTools.test.js`)
- [x] Coach message matches direct API numbers
- [x] Browser demo: report + chat without curl
- [x] `eval/scenarios.yaml` — 6 scenarios documented
- [x] Env loading reliable (`loadEnv.js` + startup diagnostics)

---

## Quick reference

```bash
npm install
cd frontend && npm install && cd ..
npm run dev:all
# → http://localhost:5173

npm test
npm run backboard:check
npm run build:web
```

See [README.md](../README.md) for curl and UI flows.

---

## Changelog (recent)

| Milestone | What shipped |
|-----------|----------------|
| Phase 0–1 | Black-hole engine, REST API, SQLite persistence |
| Phase 1b | `backboard.js`, `coachTools.js`, `POST /coach/message`, `coach_sessions` |
| Phase 2 | `frontend/` Vite app, CORS, Black Hole Report + coach chat UI |
| Env fix | `loadEnv.js` with `override: true`; `isBackboardConfigured()`; startup env path + Backboard status log |
| Phase 3 | ElevenLabs voice (planned) |
