import assert from "node:assert/strict";
import test from "node:test";
import { buildBlackHoleVoiceScript } from "./voiceSummary.js";
import { buildBlackHoleReport } from "./blackHoleEngine.js";

test("buildBlackHoleVoiceScript mentions top bleed and recommendation", () => {
  const accounts = [
    {
      id: "card-rbc-visa",
      name: "RBC Visa",
      type: "credit_card",
      balance: 4200,
      apr: 0.2299,
      minPayment: 105,
      limit: 5000
    }
  ];

  const report = buildBlackHoleReport(accounts);
  const script = buildBlackHoleVoiceScript(report);

  assert.match(script, /RBC Visa/i);
  assert.match(script, /month/i);
  assert.match(script, /RBC Visa|extra/i);
  assert.match(script, /educational|advice/i);
});
