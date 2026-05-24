# hackto-may

Proactive financial copilot for Canadian professionals (25–45): escape **interest black holes** with a backend-first API, then chat/voice via Backboard and ElevenLabs.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3001
npm test
```

## Try the hero endpoint

```bash
USER=$(curl -s -X POST http://localhost:3001/api/users \
  -H 'Content-Type: application/json' \
  -d '{"tone":"coach"}' | jq -r .id)

curl -s -X POST "http://localhost:3001/api/users/$USER/accounts/mock" \
  -H 'Content-Type: application/json' \
  -d '{"personaKey":"alex"}' | jq

curl -s "http://localhost:3001/api/users/$USER/black-holes" | jq
```

## Project structure

```text
hackto-may/
├── backend/          # API, domain logic, mock data, eval scenarios
├── docs/             # Backend plan + research
├── package.json
└── .env.example
```

| Path | Purpose |
|------|---------|
| [docs/BACKEND.md](docs/BACKEND.md) | Architecture and phased build plan |
| [docs/research/](docs/research/) | Product and market research |
| [backend/src/](backend/src/) | Express API and interest black-hole engine |
| [backend/data/sampleClients.json](backend/data/sampleClients.json) | Demo personas (alex, sam, jordan) |
| [backend/eval/scenarios.yaml](backend/eval/scenarios.yaml) | Agent evaluation scripts |

## Build phases

1. **Phase 0** ✅ black-hole engine + mock accounts + REST API  
2. **Phase 1** ✅ SQLite persistence (users, accounts, goals → `backend/data/app.db`)  
3. **Phase 1b** (next): Backboard coach + tools  
4. **Phase 2**: Frontend (`frontend/`)  
5. **Phase 3**: ElevenLabs voice + demo polish  

Copy `.env.example` to `.env` when adding Backboard or ElevenLabs keys.

### Verify Backboard

```bash
npm run backboard:check
```

Expect `✓ API key valid`, your assistant name, and a short test reply.
