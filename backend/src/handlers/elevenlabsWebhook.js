import { runCoachTool, COACH_TOOLS } from "../services/coachTools.js";
import { config } from "../config.js";

/** ElevenLabs ConvAI server tool names → local coach tools */
export const ELEVENLABS_TOOL_NAMES = COACH_TOOLS.map((t) => t.function.name);

/**
 * Map ElevenLabs webhook body to user id.
 * Configure tools with `user_id` in request_body_schema (or pass via dynamic variables).
 */
export function resolveUserIdFromWebhook(body) {
  const params = body?.parameters ?? {};
  return (
    params.user_id ??
    params.userId ??
    body?.dynamic_variables?.user_id ??
    body?.dynamic_variables?.userId ??
    null
  );
}

export function verifyElevenLabsWebhook(req) {
  const secret = config.elevenlabsWebhookSecret;
  if (!secret) return true;

  const header =
    req.get("X-Webhook-Secret") ??
    req.get("X-ElevenLabs-Webhook-Secret") ??
    req.get("Authorization")?.replace(/^Bearer\s+/i, "");

  return header === secret;
}

/**
 * Format tool output for ElevenLabs ConvAI webhook response.
 * @param {unknown} data
 */
export function formatWebhookResult(data) {
  if (typeof data === "string") return { result: data };
  if (data?.error) {
    return { result: { error: true, message: data.error, hint: data.hint } };
  }
  return { result: data };
}

/**
 * @param {string} toolName path segment (snake_case)
 * @param {string} userId
 */
export async function executeElevenLabsTool(toolName, userId) {
  if (!ELEVENLABS_TOOL_NAMES.includes(toolName)) {
    const err = new Error(`Unknown tool: ${toolName}`);
    err.status = 404;
    throw err;
  }

  return runCoachTool(userId, toolName);
}
