# Backend build plan

How we build the API **first** in `hackto-may`, before polishing the frontend. The backend owns **all numbers**; Backboard and ElevenLabs own **conversation and voice** later.

## Product slice (demo-critical)

| Priority | Capability | Backend owns |
|----------|------------|--------------|
| P0 | Unified profile | Aggregate mock/real accounts per user |
| P0 | Interest Black Hole Report | Rank debts by monthly bleed, flag min-payment traps |
| P0 | Payoff recommendation | One actionable extra payment + savings estimate |
| P0 | Credit utilization | Per-card and total utilization |
| P1 | Coach proxy | Forward chat to Backboard; run tool loop against our API |
| P1 | User + onboarding | Persona, tone, stress context (stored locally) |
| P2 | Year-round tax nudge | One rule-based insight (RRSP/FHSA-style, Canadian) |
| P2 | Spend flags, bank package | Mock only; not on demo path |

**Demo path:** `POST /users` → onboarding context → `POST /accounts/mock` → `GET /black-holes` → `POST /goals` → `POST /coach/message` (Backboard).

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Frontend (later) — static/SPA, calls /api/* only           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  HTTP API (Express) — backend/src/                            │
│  • Auth: none for hack (user id in path or header)           │
│  • Validation: Zod on request bodies                        │
│  • Errors: consistent JSON { error, code }                  │
└────────────┬───────────────────────────────┬──────────────────┘
             │                               │
┌────────────▼────────────┐     ┌────────────▼──────────────────┐
│  Domain services        │     │  Integrations                 │
│  • blackHoleEngine      │     │  • backboard.js (threads)     │
│  • payoff               │     │  • elevenlabs.js (phase 2)  │
│  • utilization          │     └───────────────────────────────┘
│  • taxNudges (rules)    │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  Data adapter interface │
│  • mockClient (now)     │
│  • apiClient (stub)     │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  SQLite (users, goals,  │
│   backboard thread ids) │
│  + sampleClients.json   │
└─────────────────────────┘
```

**Rule:** LLMs never compute interest, rankings, or balances. They call tools that hit our routes.

---

## Repo layout

```text
hackto-may/
├── docs/
│   ├── BACKEND.md
│   └── research/
│       └── canada-credit-interest-black-holes.md
├── backend/
│   ├── src/
│   │   ├── index.js            # server entry
│   │   ├── app.js              # Express routes
│   │   ├── config.js
│   │   ├── adapters/           # mock + future bank API
│   │   ├── services/           # black-hole math, utilization
│   │   └── db/                 # SQLite init, schema, store
│   ├── data/app.db             # created at runtime (gitignored)
│   ├── data/
│   │   └── sampleClients.json
│   └── eval/
│       └── scenarios.yaml
├── package.json
├── .env.example
└── README.md
```

`frontend/` will be added in Phase 2.

---

## API contract (v0)

Base: `http://localhost:3001/api`

### Users & onboarding

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/users` | `{ persona?, tone? }` | `{ id, persona, tone }` |
| `PATCH` | `/users/:id` | `{ stressTopics?, goals?, tone? }` | user |
| `GET` | `/users/:id` | — | user |

`persona`: `career_professional` | `high_loan` | `recovering`  
`tone`: `coach` | `companion` | `chief_of_staff`

### Financial data (mock for hack)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/users/:id/accounts/mock` | `{ personaKey?: "alex" \| "sam" \| "jordan" }` | accounts linked |
| `GET` | `/users/:id/profile` | — | unified snapshot |
| `GET` | `/users/:id/black-holes` | — | **hero report** |
| `GET` | `/users/:id/utilization` | — | per-card + total |

### Actions

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/users/:id/goals` | `{ type, accountId?, extraPayment? }` | goal |
| `GET` | `/users/:id/goals` | — | goals[] |

### Coach (Backboard — phase 1b)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `POST` | `/users/:id/coach/message` | `{ content }` | `{ reply, threadId }` |

Backboard tools (implemented as HTTP handlers the coach calls):

- `get_unified_profile` → `GET /users/:id/profile`
- `scan_interest_black_holes` → `GET /users/:id/black-holes`
- `recommend_payoff_action` → included in black-holes response or dedicated field

### Health

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/health` | `{ ok: true }` |

---

## Core domain: Interest Black Hole Report

**Input:** list of liabilities `{ id, name, type, balance, apr, minPayment, limit?, promoAprExpiresAt? }`

**Per liability:**

- `monthlyInterest = balance * (apr / 12)`
- `utilization = balance / limit` (cards only)
- `principalFromMin = max(0, minPayment - monthlyInterest)`
- `monthsAtMin` — amortization loop (cap at 600)
- `blackHoleScore` — weighted rank (interest $ dominates; boost high utilization; boost promo expiry soon)

**Output:**

```json
{
  "totalMonthlyInterestBurn": 187.42,
  "ranked": [
    {
      "accountId": "card-visa",
      "name": "RBC Visa",
      "monthlyInterest": 89.5,
      "utilization": 0.87,
      "flags": ["high_utilization", "minimum_payment_trap"],
      "monthsAtMinimum": 94
    }
  ],
  "recommendation": {
    "accountId": "card-visa",
    "extraPayment": 75,
    "interestSaved90Days": 412.0,
    "rationale": "avalanche"
  },
  "disclaimer": "Educational insights only, not financial advice."
}
```

Implement in `blackHoleEngine.js` with **unit-testable pure functions** (no DB in math).

---

## Data adapter interface

Both `mockClient` and future `apiClient` expose:

```js
getAccounts(userId) → Account[]
getTransactions(userId, opts?) → Transaction[]  // phase 2
getIncome(userId) → IncomeHint | null           // phase 2
```

Hackathon: only `mockClient` is wired; `apiClient` throws `NotImplemented` with a clear message.

Personas live in `backend/data/sampleClients.json` — seed on `POST .../accounts/mock`.

---

## Persistence (SQLite)

Minimal tables:

- `users` — id, persona, tone, stress_topics (JSON), created_at
- `user_accounts` — user_id, account snapshot JSON (from mock seed)
- `goals` — user_id, type, payload JSON
- `coach_sessions` — user_id, backboard_assistant_id, backboard_thread_id

No need for full transaction history in v0.

---

## Build phases (order of work)

### Phase 0 — Domain without integrations (do first)

1. `sampleClients.json` — 3 personas
2. `blackHoleEngine.js` + `payoff.js` + `utilization.js`
3. `mockClient.js`
4. Routes: health, users, mock seed, profile, black-holes
5. Manual test: `curl` black-holes for Alex → plausible numbers

**Exit criteria:** `GET /api/users/:id/black-holes` returns ranked report from mock data.

### Phase 1 — Persistence & goals ✅

1. SQLite schema + migrations on boot (`backend/src/db/`)
2. Store users and seeded accounts (`user_accounts` table)
3. Goals CRUD (SQLite)

**Exit criteria:** create user, seed mock, fetch report twice with same data (survives server restart).

### Phase 1b — Backboard

1. `BACKBOARD_API_KEY` in `.env`
2. Create assistant once (script or first-run)
3. `coach.js` — send message, handle tool calls by delegating to domain routes
4. Upload research markdown to assistant documents (optional script)

**Exit criteria:** `POST .../coach/message` “Which debt hurts me most?” returns answer grounded in tool JSON.

### Phase 2 — Frontend wire-up

1. Merge static + API in one server **or** CORS from `app.js`
2. Black Hole Report card UI
3. Chat panel → coach endpoint

### Phase 3 — ElevenLabs + demo polish

1. Webhook tool endpoints for ConvAI
2. Voice summary of top black hole
3. `eval/scenarios.yaml` — 5 scripts, run in CI or manual checklist

---

## Environment variables

```env
PORT=3001
DATABASE_PATH=./backend/data/app.db
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=
ELEVENLABS_API_KEY=
```

Run the API with `npm run dev` or `npm start` (port `3001` by default).

---

## Compliance (bake in from day one)

- Every financial response includes `disclaimer` string.
- System prompt: non-judgmental, no guaranteed score/tax outcomes.
- `guardrails.js` (later): strip “guaranteed” language; append disclaimer if missing.

---

## What we are not building in the backend first

- Live bank aggregation (Flinks/Plaid) — adapter stub only
- Full tax filing or CRA integration — one rule-based nudge max
- Stock picking / trading
- User auth / OAuth — opaque `userId` UUID is enough for demo

---

## Success metrics for “backend done enough”

- [ ] Black hole report for 3 personas returns different rankings
- [ ] Math covered by a few unit tests (interest, ranking order)
- [ ] Coach message triggers tool call and matches direct API numbers
- [ ] `eval/scenarios.yaml` — at least 5 paths documented
- [ ] README lists `curl` examples for demo rehearsal

---

## Next command after reading this

```bash
npm install
npm run dev          # API on :3001
```

See `backend/src/` for scaffolded entrypoints and `backend/data/sampleClients.json` for persona data.
