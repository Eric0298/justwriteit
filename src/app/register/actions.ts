"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registerSchema } from "@/lib/validators/auth";
import { createUser } from "@/lib/queries/users";

export type RegisterFormState = {
  ok: boolean;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  formError?: string;
};

const BCRYPT_ROUNDS = 12;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: RegisterFormState["fieldErrors"] = {};
    const flattened = parsed.error.flatten().fieldErrors;

    if (flattened.name?.[0]) fieldErrors.name = flattened.name[0];
    if (flattened.email?.[0]) fieldErrors.email = flattened.email[0];
    if (flattened.password?.[0]) fieldErrors.password = flattened.password[0];

    return { ok: false, fieldErrors, formError: "Revisa los campos del formulario." };
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await createUser({ name, email, passwordHash });

    redirect("/login?registered=1");
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        fieldErrors: { email: "Este email ya está registrado." },
        formError: "No se pudo crear la cuenta.",
      };
    }

    return {
      ok: false,
      formError: "Error inesperado. Inténtalo de nuevo.",
    };
  }
}
