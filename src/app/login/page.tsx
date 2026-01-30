"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { ok: true };

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();

  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // Toast de registro correcto
  React.useEffect(() => {
    if (params.get("registered") === "1") {
      push({
        title: "Cuenta creada ✅",
        message: "Ya puedes iniciar sesión.",
        variant: "success",
        durationMs: 3500,
      });
    }
  }, [params, push]);

  React.useEffect(() => {
    if (state.ok && !state.formError && !isPending) {
    }
  }, [state.ok, state.formError, isPending]);

  const [submittedOnce, setSubmittedOnce] = React.useState(false);
  React.useEffect(() => {
    if (isPending) setSubmittedOnce(true);
  }, [isPending]);

  React.useEffect(() => {
    if (submittedOnce && !isPending && state.ok && !state.formError) {
      router.push("/dashboard");
    }
  }, [submittedOnce, isPending, state.ok, state.formError, router]);

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted">Accede a tu dashboard.</p>

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
          <Input name="email" label="Email" type="email" autoComplete="email" />
          <Input name="password" label="Contraseña" type="password" autoComplete="current-password" />

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
