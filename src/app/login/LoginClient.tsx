"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { ok: false };

export default function LoginClient() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

        {state.formError ? (
          <div
            className="mt-4 rounded-md border p-3 text-sm"
            style={{ borderColor: "rgba(239, 68, 68, 0.6)" }}
            role="alert"
            aria-live="polite"
          >
            <span className="text-danger">{state.formError}</span>
          </div>
        ) : null}

        <form action={formAction} className="mt-6 grid gap-4">
          <Input name="email" label="Email" type="email" autoComplete="email" required />
          <Input
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" isLoading={isPending}>
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link className="underline underline-offset-4" href="/register">
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
