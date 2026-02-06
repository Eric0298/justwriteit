"use server";

import { signIn } from "@/../auth";
import { rateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/ip";

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

  // ✅ importante: NO redirectTo aquí
  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { ok: false, formError: "Email o contraseña incorrectos." };
  }

  return { ok: true };
}
