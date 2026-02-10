"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { registerSchema } from "@/lib/validators/auth";
import { createUser } from "@/lib/queries/users";

export type RegisterFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
};

function getBcryptRounds() {
  const raw = process.env.BCRYPT_ROUNDS ?? "12";
  const n = Number(raw);
  return Number.isFinite(n) && n >= 10 && n <= 14 ? n : 12;
}

type Bucket = { count: number; resetAt: number };
const registerBuckets = new Map<string, Bucket>();

async function getClientIpSafe(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

function rateLimitOrThrow(input: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const existing = registerBuckets.get(input.key);

  if (!existing || now > existing.resetAt) {
    registerBuckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return;
  }

  if (existing.count >= input.limit) throw new Error("RATE_LIMIT");

  existing.count += 1;
  registerBuckets.set(input.key, existing);
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  try {
    const ip = await getClientIpSafe();
    rateLimitOrThrow({ key: `register:${ip}`, limit: 5, windowMs: 60_000 });
  } catch (e) {
    if (e instanceof Error && e.message === "RATE_LIMIT") {
      return { ok: false, formError: "Demasiados intentos. Espera 1 minuto y vuelve a intentarlo." };
    }
    return { ok: false, formError: "No se pudo procesar la solicitud." };
  }

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Revisa los campos del formulario.",
      fieldErrors: {
        name: fe.name?.[0],
        email: fe.email?.[0],
        password: fe.password?.[0],
      },
    };
  }

  try {
    const rounds = getBcryptRounds();
    const passwordHash = await bcrypt.hash(parsed.data.password, rounds);

    await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });
  } catch (err: unknown) {
    const anyErr = err as { code?: string; message?: string };

    if (anyErr?.code === "23505") {
      return {
        ok: false,
        formError: "Ese email ya está registrado.",
        fieldErrors: { email: "Ya existe una cuenta con ese email." },
      };
    }

    return { ok: false, formError: anyErr?.message ?? "No se pudo crear la cuenta." };
  }

  redirect("/login?registered=1");
}
