import { randomUUID } from "node:crypto";
import express from "express";
import * as mock from "./adapters/mockClient.js";
import { buildBlackHoleReport } from "./services/blackHoleEngine.js";
import { buildTrends } from "./services/trends.js";
import { buildUtilizationSnapshot } from "./services/utilization.js";
import {
  config,
  isBackboardConfigured,
  isCorsOriginAllowed,
  isElevenLabsConfigured
} from "./config.js";
import * as store from "./db/store.js";
import { sendCoachMessage } from "./services/backboard.js";
import { buildBlackHoleVoiceScript } from "./services/voiceSummary.js";
import { synthesizeSpeech } from "./services/elevenlabs.js";
import {
  ELEVENLABS_TOOL_NAMES,
  executeElevenLabsTool,
  formatWebhookResult,
  resolveUserIdFromWebhook,
  verifyElevenLabsWebhook
} from "./handlers/elevenlabsWebhook.js";

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isCorsOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin.replace(/\/+$/, ""));
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "hackto-may-api",
    persistence: "sqlite",
    backboard: isBackboardConfigured(),
    elevenlabs: isElevenLabsConfigured()
  });
});

/** Demo Google sign-in — creates or returns user by email (no OAuth verifier). */
app.post("/api/auth/google", (req, res) => {
  const name = req.body?.name?.trim() || null;
  const emailInput = req.body?.email?.trim().toLowerCase();
  const email =
    emailInput || `demo-${randomUUID().slice(0, 8)}@hackto-may.local`;

  let user = store.getUserByEmail(email);
  let isNew = false;

  if (!user) {
    user = store.createUser({
      email,
      displayName: name,
      authProvider: "google"
    });
    isNew = true;
  } else if (name && !user.displayName) {
    user = store.updateUser(user.id, { displayName: name });
  }

  res.json({ user, isNew, mode: req.body?.mode ?? "signin" });
});

app.post("/api/users", (req, res) => {
  const user = store.createUser({
    persona: req.body?.persona,
    tone: req.body?.tone,
    stressTopics: req.body?.stressTopics,
    displayName: req.body?.displayName,
    dateOfBirth: req.body?.dateOfBirth,
    email: req.body?.email,
    authProvider: req.body?.authProvider,
    onboardingComplete: req.body?.onboardingComplete,
    bankConnected: req.body?.bankConnected,
    age: req.body?.age,
    whoUsesTool: req.body?.whoUsesTool,
    lifestyleBrief: req.body?.lifestyleBrief,
    lifeContext: req.body?.lifeContext
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
    stressTopics: req.body?.stressTopics,
    displayName: req.body?.displayName,
    dateOfBirth: req.body?.dateOfBirth,
    email: req.body?.email,
    authProvider: req.body?.authProvider,
    onboardingComplete: req.body?.onboardingComplete,
    bankConnected: req.body?.bankConnected,
    age: req.body?.age,
    whoUsesTool: req.body?.whoUsesTool,
    lifestyleBrief: req.body?.lifestyleBrief,
    lifeContext: req.body?.lifeContext
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
    const updated = store.updateUser(req.params.id, { bankConnected: true });
    res.json({ userId: req.params.id, user: updated, ...seeded });
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
    const report = buildBlackHoleReport(accounts);
    res.json({
      ...report,
      trends: buildTrends(accounts, report.recommendation)
    });
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

app.get("/api/users/:id/voice/summary", async (req, res, next) => {
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

    const report = buildBlackHoleReport(accounts);
    const script = buildBlackHoleVoiceScript(report);
    const top = report.ranked[0] ?? null;

    res.json({
      script,
      topAccount: top
        ? {
            accountId: top.accountId,
            name: top.name,
            monthlyInterest: top.monthlyInterest
          }
        : null,
      totalMonthlyInterestBurn: report.totalMonthlyInterestBurn,
      elevenlabsConfigured: isElevenLabsConfigured(),
      disclaimer: config.disclaimer
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/users/:id/voice/speak", async (req, res, next) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!isElevenLabsConfigured()) {
      return res.status(501).json({
        error: "ElevenLabs not configured",
        hint: "Set ELEVENLABS_API_KEY in .env for voice playback"
      });
    }

    const accounts = await mock.getAccounts(req.params.id);
    if (!accounts.length) {
      return res.status(400).json({ error: "No accounts linked" });
    }

    const report = buildBlackHoleReport(accounts);
    const script = req.body?.script?.trim() || buildBlackHoleVoiceScript(report);
    const { audioBase64, contentType } = await synthesizeSpeech(script);

    res.json({
      script,
      audioBase64,
      contentType,
      disclaimer: config.disclaimer
    });
  } catch (err) {
    if (err.status === 501) {
      return res.status(501).json({ error: err.message });
    }
    next(err);
  }
});

/** ConvAI server tools — configure in ElevenLabs agent with POST + user_id parameter */
app.get("/api/webhooks/elevenlabs/tools", (_req, res) => {
  const base = config.apiBaseUrl.replace(/\/$/, "");
  res.json({
    tools: ELEVENLABS_TOOL_NAMES.map((name) => ({
      name,
      method: "POST",
      url: `${base}/api/webhooks/elevenlabs/tools/${name}`,
      parameters: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "hackto-may user UUID from demo setup"
          }
        },
        required: ["user_id"]
      }
    })),
    hint: "Pass dynamic variable user_id at conversation start, or include user_id in tool parameters"
  });
});

app.post("/api/webhooks/elevenlabs/tools/:toolName", async (req, res, next) => {
  try {
    if (!verifyElevenLabsWebhook(req)) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const userId = resolveUserIdFromWebhook(req.body);
    if (!userId) {
      return res.status(400).json({
        error: "user_id is required",
        hint: "Add user_id to tool parameters or conversation dynamic_variables"
      });
    }

    const user = store.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const data = await executeElevenLabsTool(req.params.toolName, userId);
    res.json(formatWebhookResult(data));
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    next(err);
  }
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
