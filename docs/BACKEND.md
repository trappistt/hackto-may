# Backend build plan

Architecture and phased delivery for **Moneytor** (repo: [hackto-may](https://github.com/trappistt/hackto-may)).

The **backend owns all numbers** (interest, rankings, balances). **Backboard** owns coach chat; **ElevenLabs** owns voice (TTS + optional ConvAI webhooks). The **frontend** (`frontend/`) is a thin client over `/api/*` only — responsive web app (desktop + mobile), not a phone-frame mockup.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **0** — Domain + REST API | ✅ Done | Black-hole engine, mock personas, all P0 routes |
| **1** — SQLite persistence | ✅ Done | Users, accounts, goals survive restart |
| **1b** — Backboard coach | ✅ Done | `backboard.js` + `coachTools.js`; tool loop; `coach_sessions` |
| **2** — Frontend | ✅ Done | Moneytor UI, onboarding flow, dashboard; shadcn + Tailwind; CORS + proxy |
| **3** — ElevenLabs | ✅ Done | TTS voice summary, ConvAI webhooks, `convai:check`, setup guide |

**You are here:** **Demo-ready** — P0 + P1 + voice (Phase 3) + Moneytor UI (mist palette, SVG logo, trend area charts) are complete. **P2 is not required** for the hackathon demo. ConvAI spoken agent: [ELEVENLABS_CONVAI.md](ELEVENLABS_CONVAI.md).

**Pre-demo checklist:**

| Step | Command / action |
|------|------------------|
| Install + env | `npm install`, `cd frontend && npm install`, copy `.env.example` → `.env` |
| Backboard (coach) | `BACKBOARD_*` in `.env`, `npm run backboard:check` |
| ElevenLabs (voice) | `ELEVENLABS_API_KEY` in `.env`, `npm run elevenlabs:check` (optional: browser TTS fallback) |
| ConvAI tools (optional) | `npm run convai:check` — dashboard wiring in [ELEVENLABS_CONVAI.md](ELEVENLABS_CONVAI.md) |
| Smoke tests | `npm test`, `npm run eval:local` |
| Run demo | `npm run dev:all` → http://localhost:5173 |

**First-time setup:**

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env    # BACKBOARD_* (coach) + ELEVENLABS_API_KEY (voice)
npm run dev:all         # http://localhost:5173
```

**Commands:**

| Command | Description |
|---------|-------------|
| `npm run dev:all` | API `:3001` + UI `:5173` |
| `npm run dev` | API only |
| `npm run dev:web` | UI only (Vite proxies `/api` → `:3001`) |
| `npm test` | 10 backend unit tests |
| `npm run build:web` | Production build → `frontend/dist/` |
| `npm run backboard:check` | Verify Backboard key + assistant (direct API, not `/coach/message`) |
| `npm run elevenlabs:check` | Verify ElevenLabs API key + TTS |
| `npm run convai:check` | Verify ConvAI webhook tools locally (no ngrok) |
| `npm run eval` | Run `backend/eval/scenarios.yaml` (needs Backboard for coach scenarios) |
| `npm run eval:local` | Domain + API + voice scenarios (no Backboard) |

---

## Full stack

| Layer | Technology | Location |
|-------|------------|----------|
| **UI** | React 19, Vite 6, shadcn/ui, Tailwind, Recharts | `frontend/` |
| **API** | Node.js, Express 5, JavaScript (ESM) | `backend/src/app.js` |
| **Domain** | Pure JS modules (no I/O in engine) | `backend/src/services/` |
| **Persistence** | SQLite via `better-sqlite3` | `backend/data/app.db` |
| **Mock bank data** | JSON personas | `backend/data/sampleClients.json` |
| **Coach** | Backboard REST (`/threads/messages`, tool loop) | `backend/src/services/backboard.js` |
| **Voice** | ElevenLabs TTS + ConvAI webhooks | `elevenlabs.js`, `/api/webhooks/elevenlabs/tools/*` |
| **Config** | dotenv, repo-root `.env` | `backend/src/loadEnv.js` |
| **Dev** | `concurrently`, Vite proxy, CORS | root `package.json`, `frontend/vite.config.js` |

**Intentionally not in stack (for now):** Next.js, TypeScript, OAuth, live bank APIs (Flinks/Plaid stub only).

**UI (Moneytor):** [shadcn/ui](https://ui.shadcn.com/) + Tailwind + [blocks.so](https://blocks.so/) patterns — Inter / Inter Display, **mist** palette (`#E5F9FF` page background, `#05AB74` brand green from logo, `mist-700` primary actions), logo at `frontend/public/moneytor.svg` (source: repo-root `Moneytor.svg`). Dashboard **area charts** ([corr.sh-style](https://ui.corr.sh/components/area-chart) gradient fills via Recharts) show projected interest bleed and total balance (minimum vs. recommended extra payment).

---

## Product slice (demo-critical)

| Priority | Capability | Status |
|----------|------------|--------|
| P0 | Unified profile | ✅ `GET /profile` |
| P0 | Interest Black Hole Report | ✅ `GET /black-holes` + UI card + trend charts |
| P0 | Payoff recommendation | ✅ in black-hole `recommendation` field |
| P0 | Credit utilization | ✅ `GET /utilization` |
| P1 | User + onboarding (auth, profile, bank, tone) | ✅ Multi-step UI + SQLite profile fields |
| P1 | Coach proxy (Backboard + tools) | ✅ API + chat panel |
| P2 | Year-round tax nudge | ⏳ Not needed for demo |
| P2 | Spend flags, bank package | ⏳ Not needed for demo |

**Demo path (UI):** http://localhost:5173 → sign up / Google → name & DOB → welcome → connect bank → tone (Friend / Mom / Dad) → **dashboard** (report + trend charts + voice + coach; responsive desktop & mobile)

**Demo path (API):** `POST /auth/google` → `PATCH /users/:id` (profile, tone, `onboardingComplete`) → `POST /accounts/mock` → `GET /black-holes` → `POST /coach/message`

### Onboarding flow (UI)

| Step | Screen | API |
|------|--------|-----|
| 1 | Sign up / Log in + Continue with Google (demo) | `POST /api/auth/google` |
| 2 | Name + date of birth | `PATCH /api/users/:id` |
| 3 | Welcome + app explainer | — |
| 4 | Connect bank (mock → alex persona) | `POST /api/users/:id/accounts/mock` |
| 5 | Coach tone: Friend / Mom / Dad | `PATCH /api/users/:id` `{ tone, onboardingComplete: true }` |
| 6 | Dashboard | black holes, trends, voice, coach |

`localStorage` key: `hackto_user_id`. Resume incomplete onboarding on reload. **Restart API** after pulling auth changes (`npm run dev:all`).

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  frontend/ (Vite + React) — :5173 — Moneytor brand          │
│  • OnboardingFlow → Dashboard (BlackHole, Trends, Voice, Coach) │
│  • localStorage hackto_user_id · Vite proxy /api → :3001    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP /api/*
┌────────────────────────────▼────────────────────────────────┐
│  HTTP API (Express) — backend/src/app.js                    │
│  • CORS: FRONTEND_ORIGIN (default http://localhost:5173)    │
│  • Auth: demo POST /auth/google (no real OAuth yet)         │
│  • Session: opaque user UUID in localStorage                │
│  • Boot: loadEnv.js → config → app (see below)              │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
┌────────────▼────────────┐     ┌────────────▼──────────────────┐
│  Domain services        │     │  Integrations                 │
│  • blackHoleEngine.js   │     │  • backboard.js ✅            │
│  • trends.js ✅         │     │  • coachTools.js ✅           │
│  • utilization.js       │     │  • elevenlabs.js ✅         │
│  • voiceSummary.js ✅   │     │  • ConvAI webhooks ✅       │
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
│   ├── ELEVENLABS_CONVAI.md
│   └── research/
├── frontend/
│   ├── public/moneytor.svg
│   ├── src/
│   │   ├── App.jsx, index.css, api.js, main.jsx
│   │   ├── lib/utils.js
│   │   └── components/
│   │       ├── ui/              # shadcn
│   │       ├── onboarding/      # Auth, profile, welcome, bank, tone
│   │       ├── charts/          # TrendAreaChart (Recharts)
│   │       ├── AppShell.jsx, Dashboard.jsx, Logo.jsx
│   │       ├── BlackHoleReport.jsx, FinancialTrends.jsx
│   │       ├── CoachChat.jsx, VoiceSummary.jsx
│   │       ├── ui/chart.jsx     # ChartContainer + tooltip
│   ├── tailwind.config.js, components.json
│   └── vite.config.js           # proxy /api → :3001
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
│   │   │   ├── trends.js
│   │   │   ├── utilization.js
│   │   │   ├── backboard.js
│   │   │   ├── coachTools.js
│   │   │   ├── elevenlabs.js
│   │   │   └── voiceSummary.js
│   │   ├── handlers/
│   │   │   └── elevenlabsWebhook.js
│   │   └── db/
│   │       ├── migrate.js    # ALTER users for profile/onboarding cols
│   ├── scripts/check-backboard.js
│   ├── scripts/check-elevenlabs.js
│   ├── scripts/check-convai-webhooks.js
│   ├── scripts/run-eval.js
│   └── data/sampleClients.json
├── Moneytor.svg            # logo source
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
| `POST` | `/auth/google` | Demo sign-in `{ email?, name?, mode? }` → `{ user, isNew, mode }` |
| `POST` | `/users` | Create user (legacy; prefer `/auth/google` in UI) |
| `GET` | `/users/:id` | Profile fields + `onboardingComplete`, `bankConnected` |
| `PATCH` | `/users/:id` | `displayName`, `dateOfBirth`, `tone`, `onboardingComplete`, `bankConnected` |
| `POST` | `/users/:id/accounts/mock` | Seeds mock data; sets `bankConnected: true` |
| `GET` | `/users/:id/profile` | unified snapshot + disclaimer |
| `GET` | `/users/:id/black-holes` | **hero report** + `trends` (projected interest & balance series) |
| `GET` | `/users/:id/utilization` | per-card + aggregate |
| `POST` | `/users/:id/goals` | persisted |
| `GET` | `/users/:id/goals` | |
| `POST` | `/users/:id/coach/message` | `{ content }` → `{ reply, threadId, disclaimer }` |
| `GET` | `/users/:id/voice/summary` | Script + top black hole (no TTS) |
| `POST` | `/users/:id/voice/speak` | `{ script? }` → `{ audioBase64, contentType }` (501 if no API key) |
| `GET` | `/webhooks/elevenlabs/tools` | ConvAI webhook URLs + schemas |
| `POST` | `/webhooks/elevenlabs/tools/:name` | ElevenLabs server tool (`user_id` param) |

`persona` (user record): `career_professional` | `high_loan` | `recovering`  
`tone`: `friend` | `mom` | `dad` (also legacy `coach` | `companion` | `chief_of_staff`)  
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

### Trends (projected charts)

Implemented in `backend/src/services/trends.js`. Embedded in `GET /black-holes` as `trends` (no separate route).

**Logic:** From current account balances, estimate past months (reverse minimum-payment simulation) and project forward (minimum vs. minimum + `recommendation.extraPayment` on the top account). Same domain math as the report — not LLM-generated.

**Output:**

| Field | Description |
|-------|-------------|
| `interestBurn[]` | `{ month, minimum, optimized }` — total monthly interest bleed |
| `totalBalance[]` | `{ month, minimum, optimized }` — aggregate debt balance |
| `meta` | `{ pastMonths, futureMonths, extraPayment, topAccountName }` |
| `disclaimer` | Educational / projected-data notice |

---

## Persistence (SQLite)

| Table | Used |
|-------|------|
| `users` | ✅ persona, tone, `display_name`, `date_of_birth`, `email`, `auth_provider`, `onboarding_complete`, `bank_connected` |
| `user_accounts` | ✅ |
| `goals` | ✅ |
| `coach_sessions` | ✅ `backboard_thread_id` per user |

DB path: `DATABASE_PATH` (default `./backend/data/app.db`). Schema in `backend/src/db/schema.sql`; existing DBs upgraded via `backend/src/db/migrate.js` on boot.

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

### Phase 2 — Frontend + onboarding ✅

| Step | Status |
|------|--------|
| `frontend/` Vite + React | ✅ |
| CORS + Vite proxy `/api` → `:3001` | ✅ |
| **Moneytor** branding + logo | ✅ |
| Responsive layout (desktop 2-col, mobile stack) | ✅ |
| Onboarding: auth → profile → welcome → bank → tone | ✅ |
| `POST /auth/google` + extended `users` + `migrate.js` | ✅ |
| Dashboard: report, trends, voice, coach | ✅ |
| Mist brand palette + SVG logo | ✅ |
| Recharts area trend charts (`FinancialTrends.jsx`) | ✅ |
| Coach tones: Friend / Mom / Dad | ✅ |
| Sign out + resume incomplete onboarding | ✅ |
| shadcn/ui + Tailwind + blocks.so patterns | ✅ |
| Coach 501 fallback when Backboard off | ✅ |

**Exit criteria:** met — full demo in browser without `curl`.

### Phase 3 — ElevenLabs + demo polish ✅

| Step | Status |
|------|--------|
| ConvAI webhook tools (`POST /api/webhooks/elevenlabs/tools/:name`) | ✅ |
| Tool catalog (`GET /api/webhooks/elevenlabs/tools`) | ✅ |
| Voice summary script (`GET /voice/summary`, `voiceSummary.js`) | ✅ |
| TTS playback (`POST /voice/speak`, `elevenlabs.js`) | ✅ |
| UI “Play voice summary” (`VoiceSummary.jsx`, browser fallback) | ✅ |
| UI **Copy ID** for ConvAI `user_id` | ✅ |
| `npm run eval` / `eval:local` for `scenarios.yaml` (incl. voice) | ✅ |
| `npm run elevenlabs:check` (TTS test; `override: true` on `.env`) | ✅ |
| `npm run convai:check` (local tool execution) | ✅ |
| ConvAI setup guide | ✅ [ELEVENLABS_CONVAI.md](ELEVENLABS_CONVAI.md) |
| Wire ElevenLabs ConvAI agent in dashboard | Manual (follow guide) |

**ConvAI setup:** See [ELEVENLABS_CONVAI.md](ELEVENLABS_CONVAI.md) — `convai:check`, ngrok, tool catalog, **Copy ID** in dashboard.

**Exit criteria:** met — TTS demo in browser; ConvAI tools verified locally; dashboard wiring documented.

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
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_flash_v2_5
ELEVENLABS_WEBHOOK_SECRET=
```

Copy `.env.example` → `.env`. Loaded from **repo root** by `backend/src/loadEnv.js` (`override: true`).

After editing `.env`, **restart** the API. On startup you should see:

```text
Env file: /path/to/hackto-may/.env (found)
Backboard: configured (coach enabled)
ElevenLabs: configured (voice TTS enabled)
```

### Troubleshooting: ElevenLabs

**Verify TTS (what the demo UI uses):**

```bash
npm run elevenlabs:check
```

Success ends with `✓ TTS test OK (... bytes mp3)`. The script loads repo-root `.env` with **`override: true`** (same as the API). It may skip the voices list if your key lacks `voices_read` — that is fine; TTS is the real check.

**“ELEVENLABS_API_KEY is missing in .env”** but the key is in the file:

1. **Save** `.env` and run the check again (the script prints the path it read).
2. **Stale shell export** — `unset ELEVENLABS_API_KEY` or open a new terminal, then `npm run elevenlabs:check`.
3. Variable name must be exactly `ELEVENLABS_API_KEY` (no spaces around `=`).

**UI plays browser voice, not ElevenLabs:** API not restarted after adding the key, or `GET /api/health` shows `"elevenlabs": false`. Restart `npm run dev:all`.

| Variable | Where to get it |
|----------|-----------------|
| `ELEVENLABS_API_KEY` | [ElevenLabs profile](https://elevenlabs.io/app/settings/api-keys) |
| `ELEVENLABS_VOICE_ID` | Voice library (default `EXAVITQu4vr4xnSDxMaL` in `.env.example`) |

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

### Troubleshooting: sign-up / login 404

`POST /api/auth/google` returns **404** when the API process is stale (started before the route existed) or failed to boot.

1. **Restart** both servers: `npm run dev:all` (not UI-only `dev:web`).
2. Verify: `curl -X POST http://localhost:3001/api/auth/google -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'` → **200** with `{ user, isNew }`.
3. Use the UI at **http://localhost:5173** so Vite proxies `/api` to `:3001`.

---

## Compliance

- ✅ Financial responses include `disclaimer` string (API + UI)
- Backboard assistant `system_prompt`: non-judgmental, call tools for numbers, not licensed advice
- `guardrails.js` — later

---

## Success metrics

- [x] Black hole report for 3 personas returns different rankings
- [x] Math covered by unit tests (`blackHoleEngine.test.js`, `store.test.js`, `coachTools.test.js`, `trends.test.js`)
- [x] Coach message matches direct API numbers
- [x] Browser demo: report + chat without curl
- [x] `eval/scenarios.yaml` — 7 scenarios; `npm run eval:local` runs 5 without Backboard
- [x] `npm run convai:check` — ConvAI tools + voice script
- [x] Env loading reliable (`loadEnv.js` + startup diagnostics)
- [x] Voice summary TTS via `POST /voice/speak` + `elevenlabs:check`
- [x] Onboarding flow persists user profile and reaches dashboard
- [x] Moneytor responsive UI on desktop and mobile
- [x] Dashboard trend charts (interest bleed + balance; minimum vs. optimized)
- [x] Moneytor mist palette + SVG wordmark

---

## Quick reference

```bash
npm install
cd frontend && npm install && cd ..
npm run dev:all
# → http://localhost:5173

npm test
npm run backboard:check
npm run elevenlabs:check
npm run convai:check
npm run eval:local
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
| Phase 3 closed | Voice summary API, ConvAI webhooks, `convai:check`, ELEVENLABS_CONVAI.md, Copy ID, voice eval, demo-ready docs |
| UI + onboarding | Moneytor brand, shadcn UI, multi-step onboarding, `/auth/google`, user profile migration, responsive dashboard |
| UI polish + trends | Mist palette (`#E5F9FF`), SVG logo, `trends.js` + Recharts area charts on dashboard, 10 unit tests |
