# ElevenLabs ConvAI setup (Phase 3)

Use this after `npm run elevenlabs:check` passes. The **browser demo** only needs TTS (`POST /voice/speak`). **ConvAI** adds a spoken agent that calls the same tools as the Backboard coach.

## 1. Verify local webhooks

```bash
npm run convai:check
```

You should see three tools OK plus a sample `user_id`. No API server or ngrok required for this step.

## 2. Expose the API (local dev)

ElevenLabs must reach your machine:

```bash
# Terminal A
npm run dev

# Terminal B — replace port if API_PORT differs
ngrok http 3001
```

Set in `.env`:

```env
API_BASE_URL=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app
```

Restart the API so tool URLs in the catalog use the public base URL.

## 3. Tool catalog

With the API running:

```bash
curl -s http://localhost:3001/api/webhooks/elevenlabs/tools | jq
```

Each tool is a **POST** webhook with required body parameter `user_id` (hackto-may user UUID).

| Tool | Same data as |
|------|----------------|
| `get_unified_profile` | `GET /api/users/:id/profile` |
| `scan_interest_black_holes` | `GET /api/users/:id/black-holes` |
| `recommend_payoff_action` | black-hole `recommendation` |

## 4. ElevenLabs agent (dashboard)

1. Create or open a [ConvAI agent](https://elevenlabs.io/app/conversational-ai).
2. Add **Server tools** — one per row from the catalog (`method`, `url`, `user_id` in request schema).
3. Set a **dynamic variable** `user_id` at conversation start (or pass it on each tool call).
4. Optional system prompt: “Call tools for all dollar amounts and rankings; never invent balances.”

**Demo user id:** In the UI (http://localhost:5173), after onboarding use **Copy ID** in the header. Paste that UUID as `user_id` in the agent test panel or dynamic variables.

## 5. Webhook secret (optional)

```env
ELEVENLABS_WEBHOOK_SECRET=your-random-string
```

ElevenLabs must send header `X-Webhook-Secret` (or `Authorization: Bearer <secret>`) on tool POSTs.

## 6. Smoke test

1. `npm run dev:all` → pick persona **alex** → **Copy ID**.
2. In ElevenLabs agent test, set `user_id` to that UUID.
3. Ask: “Which debt hurts me most per month?”
4. Agent should call `scan_interest_black_holes` and mention RBC Visa–class bleed (~$95/mo for alex).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tool 401 | Set `ELEVENLABS_WEBHOOK_SECRET` on both sides or remove it |
| Tool 400 `user_id is required` | Pass demo UUID in parameters or dynamic variables |
| Tool 404 user | Run demo setup first (`POST /users` + mock seed) |
| Wrong numbers | Backend owns math — do not let the agent calculate interest |

TTS-only demo: `ELEVENLABS_API_KEY` + **Play voice summary** in the UI — no ConvAI required.
