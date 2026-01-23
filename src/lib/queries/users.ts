import { query } from "@/lib/db";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  verified_at: string | null;
};

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const email = input.email.trim().toLowerCase();

  const res = await query<UserRow>(
    `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, password_hash, created_at, verified_at
    `,
    [input.name.trim(), email, input.passwordHash]
  );

  return res.rows[0];
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
