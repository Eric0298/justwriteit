import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = process.cwd();

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2];
  }

  return env;
}

function status(name, ok, detail = "") {
  const mark = ok ? "OK" : "MISSING";
  console.log(`${mark.padEnd(8)} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function checkDatabase(env) {
  if (!env.DATABASE_URL) {
    status("DATABASE_URL", false);
    return;
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const tables = [
      "users",
      "transcriptions",
      "daily_usage",
      "rate_limits",
      "live_sessions",
      "live_audio_chunks",
    ];

    const tableRes = await client.query(
      "select table_name from information_schema.tables where table_schema='public' and table_name = any($1) order by table_name",
      [tables]
    );

    const foundTables = new Set(tableRes.rows.map((row) => row.table_name));

    status(
      "database tables",
      tables.every((table) => foundTables.has(table)),
      `${foundTables.size}/${tables.length}`
    );
  } catch (error) {
    status("database connection", false, error instanceof Error ? error.message : "failed");
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function checkWhisper(env) {
  const url = (env.WHISPER_SERVICE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
    status("whisper /health", res.ok, `${res.status}`);
  } catch (error) {
    status("whisper /health", false, error instanceof Error ? error.message : "failed");
  }
}

async function main() {
  const env = {
    ...readEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "WHISPER_SERVICE_URL",
    "BLOB_READ_WRITE_TOKEN",
  ];

  console.log("JustWriteIt setup check");
  console.log("");

  for (const name of required) {
    status(name, Boolean(env[name] && String(env[name]).trim()));
  }

  console.log("");
  await checkDatabase(env);
  console.log("");
  await checkWhisper(env);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
