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
    <div className="w-full max-w-md">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted">
            Accede a tu panel para gestionar tus transcripciones
          </p>
        </div>

        {state.formError ? (
          <div
            className="mb-4 rounded-md border p-3 text-sm"
            style={{ borderColor: "rgba(239, 68, 68, 0.6)" }}
            role="alert"
            aria-live="polite"
          >
            <span style={{ color: "rgb(var(--danger))" }}>
              {state.formError}
            </span>
          </div>
        ) : null}

        <form action={formAction} className="grid gap-4">
          <Input
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />

          <Input
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
          />

          <Button type="submit" isLoading={isPending} className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link
            className="font-medium underline underline-offset-4"
            href="/register"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
