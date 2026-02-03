"use server";

import { signIn } from "@/../auth";

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
