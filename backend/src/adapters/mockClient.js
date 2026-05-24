import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "../db/store.js";

const root = dirname(fileURLToPath(import.meta.url));
const samplePath = join(root, "../../data/sampleClients.json");

let sampleClients = null;

async function loadSamples() {
  if (!sampleClients) {
    const raw = await readFile(samplePath, "utf8");
    sampleClients = JSON.parse(raw);
  }
  return sampleClients;
}

/**
 * @param {string} userId
 * @param {string} [personaKey='alex']
 */
export async function seedMockAccounts(userId, personaKey = "alex") {
  const samples = await loadSamples();
  const persona = samples[personaKey];
  if (!persona) {
    throw new Error(`Unknown persona: ${personaKey}`);
  }

  const accounts = structuredClone(persona.accounts);
  store.saveUserAccounts(userId, personaKey, accounts);

  return { personaKey, label: persona.label, accountCount: accounts.length };
}

/** @param {string} userId */
export async function getAccounts(userId) {
  const { accounts } = store.getUserAccounts(userId);
  return accounts;
}

/** @param {string} userId */
export async function getPersonaMeta(userId) {
  const { personaKey } = store.getUserAccounts(userId);
  if (!personaKey) return null;

  const samples = await loadSamples();
  const persona = samples[personaKey];
  return { personaKey, label: persona?.label, description: persona?.description };
}

/** @type {import('./types.js').FinancialAdapter} */
export const mockClient = {
  getAccounts
};
