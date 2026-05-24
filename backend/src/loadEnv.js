import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const envFilePath = resolve(root, ".env");

/** Load repo-root .env. override:true so empty shell exports (e.g. from `source .env` before keys were set) do not block file values. */
export const envLoadResult = loadEnv({
  path: envFilePath,
  override: true
});

export const envFileExists = existsSync(envFilePath);
