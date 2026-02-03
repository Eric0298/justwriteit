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
  // ✅ Rate limit por IP (anti brute-force)
  const ip = await getClientIp();
  const rl = await rateLimit({
    key: `auth:login:ip:${ip}`,
    limit: 10, // 10 intentos
    windowMs: 10 * 60_000, // por 10 min
  });

  if (!rl.ok) {
    return { ok: false, formError: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      return { ok: false, formError: "Email o contraseña incorrectos." };
    }

    return { ok: true };
  } catch {
    return { ok: false, formError: "No se pudo iniciar sesión. Inténtalo de nuevo." };
  }
}
