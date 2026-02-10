"use server";

import { signIn } from "@/../auth";
import { redirect } from "next/navigation";
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
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, formError: "Credenciales incorrectas." };
    }
    return { ok: false, formError: "No se pudo iniciar sesión." };
  }

  redirect("/dashboard");
}
