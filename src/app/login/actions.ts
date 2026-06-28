"use server";

import { signIn } from "@/../auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export type LoginFormState = {
  ok: boolean;
  formError?: string;
};

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const ip = await getClientIp();
    const limited = await rateLimit({
      key: `login:${ip}:${email || "unknown"}`,
      limit: 8,
      windowMs: 10 * 60_000,
    });

    if (!limited.ok) {
      return { ok: false, formError: "Demasiados intentos. Espera unos minutos." };
    }
  } catch {
    return { ok: false, formError: "No se pudo iniciar sesion" };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, formError: "Credenciales incorrectas" };
    return { ok: false, formError: "No se pudo iniciar sesion" };
  }

  redirect("/dashboard");
}

