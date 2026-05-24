import express from "express";
import * as mock from "./adapters/mockClient.js";
import { buildBlackHoleReport } from "./services/blackHoleEngine.js";
import { buildUtilizationSnapshot } from "./services/utilization.js";
import { config, isBackboardConfigured } from "./config.js";
import * as store from "./db/store.js";
import { sendCoachMessage } from "./services/backboard.js";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hackto-may-api", persistence: "sqlite" });
});

app.post("/api/users", (req, res) => {
  const user = store.createUser({
    persona: req.body?.persona,
    tone: req.body?.tone,
    stressTopics: req.body?.stressTopics
  });
  res.status(201).json(user);
});

app.get("/api/users/:id", (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.patch("/api/users/:id", (req, res) => {
  const user = store.updateUser(req.params.id, {
    persona: req.body?.persona,
    tone: req.body?.tone,
    stressTopics: req.body?.stressTopics
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/users/:id/accounts/mock", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const personaKey = req.body?.personaKey ?? "alex";
    const seeded = await mock.seedMockAccounts(req.params.id, personaKey);
    res.json({ userId: req.params.id, ...seeded });
  } catch (err) {
    next(err);
  }
});

app.get("/api/users/:id/profile", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const accounts = await mock.getAccounts(req.params.id);
    const persona = await mock.getPersonaMeta(req.params.id);
    const utilization = buildUtilizationSnapshot(accounts);
    const totalDebt = accounts.reduce((s, a) => s + a.balance, 0);

    res.json({
      user,
      persona,
      accountCount: accounts.length,
      totalDebt: Math.round(totalDebt * 100) / 100,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        apr: a.apr,
        minPayment: a.minPayment,
        limit: a.limit
      })),
      utilization: utilization.aggregateUtilizationPercent,
      disclaimer: config.disclaimer
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/users/:id/black-holes", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const accounts = await mock.getAccounts(req.params.id);
    if (!accounts.length) {
      return res.status(400).json({
        error: "No accounts linked",
        hint: "POST /api/users/:id/accounts/mock with { personaKey: 'alex' }"
      });
    }
    res.json(buildBlackHoleReport(accounts));
  } catch (err) {
    next(err);
  }
});

app.get("/api/users/:id/utilization", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const accounts = await mock.getAccounts(req.params.id);
    res.json({ ...buildUtilizationSnapshot(accounts), disclaimer: config.disclaimer });
  } catch (err) {
    next(err);
  }
});

app.post("/api/users/:id/goals", (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const goal = store.createGoal(
    req.params.id,
    req.body?.type ?? "extra_payment",
    req.body ?? {}
  );
  res.status(201).json(goal);
});

app.get("/api/users/:id/goals", (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ goals: store.listGoals(req.params.id) });
});

app.post("/api/users/:id/coach/message", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!isBackboardConfigured()) {
      return res.status(501).json({
        error: "Backboard not configured",
        hint: "Set BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID in .env",
        fallback: "Use GET /api/users/:id/black-holes for demo without coach"
      });
    }

    const content = req.body?.content?.trim();
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await sendCoachMessage(req.params.id, content);
    res.json({ reply: result.reply, threadId: result.threadId, disclaimer: config.disclaimer });
  } catch (err) {
    if (err.status && err.status >= 400 && err.status < 500) {
      return res.status(502).json({ error: err.message });
    }
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
