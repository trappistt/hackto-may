import "./loadEnv.js";
import { resolve } from "node:path";
import { config, isBackboardConfigured } from "./config.js";
import app from "./app.js";
import { initDb } from "./db/index.js";
import { envFileExists, envFilePath } from "./loadEnv.js";

const databasePath = resolve(config.databasePath);
initDb(databasePath);

app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
  console.log(`Health: http://localhost:${config.port}/api/health`);
  console.log(`Database: ${databasePath}`);
  console.log(`Env file: ${envFilePath} (${envFileExists ? "found" : "missing"})`);

  if (isBackboardConfigured()) {
    console.log("Backboard: configured (coach enabled)");
  } else {
    console.log(
      "Backboard: not configured — set BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID in .env"
    );
    console.log(
      "Tip: if you ran `source .env` before filling keys, open a new terminal or run `unset BACKBOARD_API_KEY BACKBOARD_ASSISTANT_ID`"
    );
  }
});
