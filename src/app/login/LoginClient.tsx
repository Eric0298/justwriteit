"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type LoginFormState } from "./actions";
import { LogIn, Mail, Lock, ArrowRight } from "lucide-react";

const initialState: LoginFormState = { ok: false };

export default function LoginClient() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-md">
      <div className="auth-card p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[16px] auth-badge">
            <LogIn size={20} aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted">
            Accede a tu panel para gestionar tus transcripciones.
          </p>
        </div>

        {/* Error box */}
        {state.formError ? (
          <div className="alert alert-danger mb-4" role="alert" aria-live="polite">
            <p className="font-medium">No se pudo iniciar sesión</p>
            <p className="mt-1">{state.formError}</p>
          </div>
        ) : null}

        {/* Form */}
        <form action={formAction} className="grid gap-4">
          <div className="relative">
            <span className="input-icon" aria-hidden="true">
              <Mail size={16} />
            </span>
            <Input
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              className="pl-10"
            />
          </div>

          <div className="relative">
            <span className="input-icon" aria-hidden="true">
              <Lock size={16} />
            </span>
            <Input
              name="password"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              className="pl-10"
            />
          </div>

          <Button type="submit" isLoading={isPending} className="w-full">
            <span>Entrar</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link className="link-soft" href="/register">
            Crear cuenta
          </Link>
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        JustWriteIt · Tu espacio para transcribir y estudiar.
      </p>
    </div>
  );
}
