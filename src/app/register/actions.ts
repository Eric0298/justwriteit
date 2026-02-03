// src/app/register/actions.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
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

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const input = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
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

    redirect("/login?registered=1");
  } catch (err: unknown) {
    // Postgres duplicate email: 23505
    const anyErr = err as { code?: string; message?: string };
    if (anyErr?.code === "23505") {
      return {
        ok: false,
        formError: "Ese email ya está registrado.",
        fieldErrors: { email: "Ya existe una cuenta con ese email." },
      };
    }

    return {
      ok: false,
      formError: anyErr?.message ?? "No se pudo crear la cuenta.",
    };
  }
}
