import { query } from "@/lib/db";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  verified_at: Date | null;
};

export type PublicUser = Omit<UserRow, "password_hash">;

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const res = await query<UserRow>(
    `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, password_hash, created_at, verified_at
    `,
    [name, email, input.passwordHash]
  );

  const row = res.rows[0];
  if (!row) {
    throw new Error("No se pudo crear el usuario (sin fila de retorno).");
  }

  return row;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const res = await query<UserRow>(
    `
    SELECT id, name, email, password_hash, created_at, verified_at
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email.trim().toLowerCase()]
  );

  return res.rows[0] ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const res = await query<UserRow>(
    `
    SELECT id, name, email, password_hash, created_at, verified_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return res.rows[0] ?? null;
}

export async function setUserVerified(id: string): Promise<UserRow | null> {
  const res = await query<UserRow>(
    `
    UPDATE users
    SET verified_at = now()
    WHERE id = $1
    RETURNING id, name, email, password_hash, created_at, verified_at
    `,
    [id]
  );

  return res.rows[0] ?? null;
}
