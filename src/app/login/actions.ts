"use server";

import { signIn } from "@/../auth";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/ip";
import { AuthError } from "next-auth";

export type LoginFormState = {
  ok: boolean;
  formError?: string;
};

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const ip = await getClientIp();
  const rl = await rateLimit({
    key: `auth:login:ip:${ip}`,
    limit: 10,
    windowMs: 10 * 60_000,
  });

  if (!rl.ok) {
    return { ok: false, formError: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, formError: "Email y contraseña son requeridos." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, formError: "Email o contraseña incorrectos." };
    }
    throw e;
  }
}
