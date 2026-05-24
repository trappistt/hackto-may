import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { config } from "./config.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: resolve(root, ".env") });
import { initDb } from "./db/index.js";
import { resolve } from "node:path";

const databasePath = resolve(config.databasePath);
initDb(databasePath);

app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
  console.log(`Health: http://localhost:${config.port}/api/health`);
  console.log(`Database: ${databasePath}`);
});
