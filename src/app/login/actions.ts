"use server";

import { signIn } from "@/../auth";
import { AuthError } from "next-auth";

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
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, formError: "Credenciales incorrectas." };
    }
    throw e;
  }
}
