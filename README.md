# hackto-may

Proactive financial copilot for Canadian professionals (25–45): escape **interest black holes** with a backend-first API, then chat via Backboard (voice via ElevenLabs next).

## Quick start (full demo UI)

```bash
npm install
cd frontend && npm install && cd ..
npm run dev:all
```

Open **http://localhost:5173** — pick a demo persona, view the Black Hole Report, chat with the coach.

| Command | What it runs |
|---------|----------------|
| `npm run dev:all` | API `:3001` + UI `:5173` |
| `npm run dev` | API only |
| `npm run dev:web` | UI only (proxies `/api` to the API) |
| `npm test` | Backend unit tests |
| `npm run backboard:check` | Verify Backboard credentials |

Copy `.env.example` → `.env` for Backboard coach chat (`BACKBOARD_API_KEY`, `BACKBOARD_ASSISTANT_ID`).

## Try the API (curl)

```bash
USER=$(curl -s -X POST http://localhost:3001/api/users \
  -H 'Content-Type: application/json' \
  -d '{"tone":"coach"}' | jq -r .id)

curl -s -X POST "http://localhost:3001/api/users/$USER/accounts/mock" \
  -H 'Content-Type: application/json' \
  -d '{"personaKey":"alex"}' | jq

curl -s "http://localhost:3001/api/users/$USER/black-holes" | jq

curl -s -X POST "http://localhost:3001/api/users/$USER/coach/message" \
  -H 'Content-Type: application/json' \
  -d '{"content":"Which debt hurts me most per month?"}' | jq
```

## Project structure

```text
hackto-may/
├── frontend/         # Vite + React demo UI
├── backend/          # API, domain logic, mock data, eval scenarios
├── docs/             # Backend plan + research
└── package.json
```

| Path | Purpose |
|------|---------|
| [docs/BACKEND.md](docs/BACKEND.md) | Architecture and phased build plan |
| [frontend/src/](frontend/src/) | Black hole report + coach chat |
| [backend/src/](backend/src/) | Express API and interest black-hole engine |
| [backend/data/sampleClients.json](backend/data/sampleClients.json) | Demo personas (alex, sam, jordan) |

## Build phases

1. **Phase 0** ✅ black-hole engine + mock accounts + REST API  
2. **Phase 1** ✅ SQLite persistence  
3. **Phase 1b** ✅ Backboard coach + tools  
4. **Phase 2** ✅ Frontend (`frontend/`)  
5. **Phase 3** (next): ElevenLabs voice + demo polish  
