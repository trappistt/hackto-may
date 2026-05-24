import { config } from "../config.js";
import * as store from "../db/store.js";
import { COACH_TOOLS, runCoachTool } from "./coachTools.js";

const BACKBOARD_BASE = "https://app.backboard.io/api";
const MAX_TOOL_ROUNDS = 8;

const TONE_INSTRUCTIONS = {
  friend:
    "Speak like a supportive peer: casual, encouraging, never preachy or shaming.",
  mom: "Speak like a caring but firm parent: warm, direct, and honest about the numbers.",
  dad: "Speak like a practical parent: straightforward, plan-focused, minimal drama.",
  coach: "Speak like a calm financial coach: clear, actionable, non-judgmental.",
  companion: "Speak like a trusted companion: empathetic and collaborative.",
  chief_of_staff: "Speak like a chief of staff: concise, strategic, numbers-first."
};

/** @param {import('../db/store.js').ReturnType<typeof store.getUser>} user */
function buildCoachPreamble(user) {
  const lines = [];
  const toneKey = user?.tone && TONE_INSTRUCTIONS[user.tone] ? user.tone : "friend";
  lines.push(`[Coach tone: ${toneKey}. ${TONE_INSTRUCTIONS[toneKey]}]`);

  if (user?.displayName?.trim()) {
    lines.push(`[Address the user as ${user.displayName.trim().split(/\s+/)[0]}].`);
  }
  if (user?.lifestyleBrief?.trim()) {
    lines.push(`[Lifestyle: ${user.lifestyleBrief.trim()}]`);
  }
  if (user?.lifeContext?.trim()) {
    lines.push(`[What they shared about their situation: ${user.lifeContext.trim()}]`);
  }

  return `${lines.join("\n")}\n\n`;
}

function apiHeaders() {
  return {
    "X-API-Key": config.backboardApiKey,
    "Content-Type": "application/json"
  };
}

/**
 * @param {string} path
 * @param {Record<string, unknown>} body
 */
async function postBackboard(path, body) {
  const res = await fetch(`${BACKBOARD_BASE}${path}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.error ?? data?.message ?? `Backboard API error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

/**
 * @param {string} userId
 * @param {Array<{ id: string, function: { name: string, arguments?: string } }>} toolCalls
 */
async function buildToolOutputs(userId, toolCalls) {
  const outputs = [];

  for (const tc of toolCalls) {
    const name = tc.function?.name;
    try {
      const result = await runCoachTool(userId, name);
      outputs.push({ tool_call_id: tc.id, output: JSON.stringify(result) });
    } catch (err) {
      outputs.push({
        tool_call_id: tc.id,
        output: JSON.stringify({ error: err.message ?? "Tool failed" })
      });
    }
  }

  return outputs;
}

/**
 * @param {string} userId
 * @param {{ status?: string, tool_calls?: unknown[], thread_id?: string }} response
 */
async function runToolLoop(userId, response) {
  let current = response;
  let rounds = 0;

  while (current.status === "REQUIRES_ACTION" && current.tool_calls?.length) {
    if (++rounds > MAX_TOOL_ROUNDS) {
      throw new Error("Coach exceeded maximum tool-call rounds");
    }

    const tool_outputs = await buildToolOutputs(userId, current.tool_calls);
    current = await postBackboard("/threads/tool-outputs", {
      thread_id: current.thread_id,
      tool_outputs
    });
  }

  return current;
}

/**
 * Send a user message to Backboard with financial tools; returns assistant reply.
 * @param {string} userId
 * @param {string} content
 */
export async function sendCoachMessage(userId, content) {
  const session = store.getCoachSession(userId);
  const user = store.getUser(userId);
  const preamble = user ? buildCoachPreamble(user) : "";

  const payload = {
    content: `${preamble}${content}`,
    assistant_id: config.backboardAssistantId,
    tools: COACH_TOOLS,
    stream: false,
    memory: "off"
  };

  if (session?.backboardThreadId) {
    payload.thread_id = session.backboardThreadId;
  }

  let response = await postBackboard("/threads/messages", payload);
  response = await runToolLoop(userId, response);

  if (response.thread_id) {
    store.saveCoachSession(
      userId,
      response.assistant_id ?? config.backboardAssistantId,
      response.thread_id
    );
  }

  if (response.status === "FAILED") {
    throw new Error("Backboard run failed");
  }

  return {
    reply: response.content ?? "",
    threadId: response.thread_id
  };
}
