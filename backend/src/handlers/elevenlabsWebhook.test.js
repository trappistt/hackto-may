import assert from "node:assert/strict";
import test from "node:test";
import { resolveUserIdFromWebhook } from "./elevenlabsWebhook.js";

test("resolveUserIdFromWebhook reads parameters and dynamic_variables", () => {
  assert.equal(
    resolveUserIdFromWebhook({ parameters: { user_id: "abc" } }),
    "abc"
  );
  assert.equal(
    resolveUserIdFromWebhook({ dynamic_variables: { userId: "xyz" } }),
    "xyz"
  );
  assert.equal(resolveUserIdFromWebhook({}), null);
});
