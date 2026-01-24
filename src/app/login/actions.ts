"use server";

import { z } from "zod";
import { signIn } from "@/../../auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email no válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      formError: "Revisa los datos.",
      fieldErrors: {
        email: fe.email?.[0],
        password: fe.password?.[0],
      },
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch {
    return { ok: false, formError: "Email o contraseña incorrectos." };
  }
}
