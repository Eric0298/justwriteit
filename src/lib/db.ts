import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
  type QueryConfig,
} from "pg";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definida en el entorno.");
  }
  return url;
}

// Tipos “seguros” para parámetros de SQL en Postgres.
// Si más adelante necesitas JSON u otros tipos, lo ampliamos.
export type DbValue =
  | string
  | number
  | boolean
  | null
  | Date
  | Buffer
  | Uint8Array
  | DbValue[];

export type DbValues = DbValue[];

declare global {
  var __dbPool: Pool | undefined;
}

const pool =
  globalThis.__dbPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: DbValues = []
): Promise<QueryResult<T>> {
  const config: QueryConfig = { text, values };
  return pool.query<T>(config);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}
