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
| `npm run backboard:check` | Verify Backboard key + assistant (no coach route) |

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
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
┌────────────▼────────────┐     ┌────────────▼──────────────────┐
│  Domain services        │     │  Integrations                 │
│  • blackHoleEngine.js   │     │  • backboard.js ✅            │
│  • utilization.js       │     │  • coachTools.js ✅           │
│                         │     │  • elevenlabs.js (Phase 3)  │
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

---

## Repo layout

```text
hackto-may/
├── docs/
│   ├── BACKEND.md
│   └── research/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── DemoSetup.jsx
│   │       ├── BlackHoleReport.jsx
│   │       └── CoachChat.jsx
│   ├── vite.config.js      # proxy /api → :3001
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.js, env.js, app.js, config.js
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

---

## Core domain: Interest Black Hole Report

Implemented in `backend/src/services/blackHoleEngine.js`.

**Per liability:** monthly interest, utilization, months at minimum payment, flags, `blackHoleScore`.

**Output:** `totalMonthlyInterestBurn`, `ranked[]`, `recommendation`, `disclaimer`.

---

## Persistence (SQLite)

| Table | Used |
|-------|------|
| `users` | ✅ |
| `user_accounts` | ✅ |
| `goals` | ✅ |
| `coach_sessions` | ✅ `backboard_thread_id` per user |

DB path: `DATABASE_PATH` (default `./backend/data/app.db`).

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
| `backend/src/env.js` loads dotenv before `config.js` | ✅ |
| `backboard.js` + `coachTools.js` + tool loop | ✅ |
| `POST /coach/message` + `coach_sessions` | ✅ |
| Upload research doc to assistant (optional) | ⏳ |

**Exit criteria:** met — coach answers grounded in tool JSON (e.g. RBC Visa $95.29/mo for alex).

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

**Exit criteria:** met — full demo in browser without `curl`.

### Phase 3 — ElevenLabs + demo polish

1. Webhook tool endpoints for ConvAI
2. Voice summary of top black hole
3. Run `eval/scenarios.yaml` manually or in CI

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

Copy `.env.example` → `.env`. API loads via `backend/src/env.js` on boot.

Frontend optional override: `frontend/.env` with `VITE_API_URL=http://localhost:3001` if not using the Vite proxy.

---

## Compliance

- ✅ Financial responses include `disclaimer` string (API + UI)
- Backboard assistant: non-judgmental, call tools for numbers, not licensed advice
- `guardrails.js` — later

---

## Success metrics

- [x] Black hole report for 3 personas returns different rankings
- [x] Math covered by unit tests
- [x] Coach message matches direct API numbers
- [x] Browser demo: report + chat without curl
- [x] `eval/scenarios.yaml` — 6 scenarios documented

---

## Quick reference

```bash
npm install
cd frontend && npm install && cd ..
npm run dev:all
# → http://localhost:5173

npm test
npm run backboard:check
npm run build:web    # production static build
```

See [README.md](../README.md) for curl and UI flows.

---

## Changelog (recent)

| Date | Milestone |
|------|-----------|
| Phase 0–1 | Black-hole engine, REST API, SQLite persistence |
| Phase 1b | `backboard.js`, `coachTools.js`, `POST /coach/message`, `coach_sessions` |
| Phase 2 | `frontend/` Vite app, CORS, Black Hole Report + coach chat UI |
| Phase 3 | ElevenLabs voice (planned) |
