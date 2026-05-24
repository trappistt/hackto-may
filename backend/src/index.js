import "./env.js";
import { resolve } from "node:path";
import app from "./app.js";
import { config } from "./config.js";
import { initDb } from "./db/index.js";

const databasePath = resolve(config.databasePath);
initDb(databasePath);

app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
  console.log(`Health: http://localhost:${config.port}/api/health`);
  console.log(`Database: ${databasePath}`);
});
