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
      "daily_usage",
      "subscriptions",
      "stripe_events",
      "rate_limits",
      "live_sessions",
      "live_audio_chunks",
    ];

    const tableRes = await client.query(
      "select table_name from information_schema.tables where table_schema='public' and table_name = any($1) order by table_name",
      [tables]
    );

    const columnRes = await client.query(
      "select column_name from information_schema.columns where table_schema='public' and table_name='users' and column_name = any($1) order by column_name",
      [["plan", "stripe_customer_id", "updated_at"]]
    );

    const foundTables = new Set(tableRes.rows.map((row) => row.table_name));
    const foundColumns = new Set(columnRes.rows.map((row) => row.column_name));

    status(
      "database migration tables",
      tables.every((table) => foundTables.has(table)),
      `${foundTables.size}/${tables.length}`
    );
    status(
      "users billing columns",
      ["plan", "stripe_customer_id", "updated_at"].every((column) =>
        foundColumns.has(column)
      ),
      `${foundColumns.size}/3`
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
    const data = await res.json().catch(() => null);
    const isNewHealth =
      data &&
      typeof data === "object" &&
      "authEnabled" in data &&
      "maxAudioFileSizeMb" in data;

    status("whisper /health", res.ok, `${res.status}`);
    status("whisper new code loaded", Boolean(isNewHealth));
    if (isNewHealth) {
      status("whisper service auth", data.authEnabled === true);
    }
  } catch (error) {
    status("whisper /health", false, error instanceof Error ? error.message : "failed");
  }
}

async function main() {
  const env = {
    ...readEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const requiredServer = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "WHISPER_SERVICE_URL",
    "WHISPER_SERVICE_TOKEN",
  ];

  const stripe = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_PREMIUM",
  ];

  console.log("JustWriteIt freemium setup check");
  console.log("");

  for (const name of requiredServer) {
    status(name, Boolean(env[name] && String(env[name]).trim()));
  }

  for (const name of stripe) {
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

