"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { registerSchema } from "@/lib/validators/auth";
import type { RegisterInput } from "@/lib/validators/auth";
import { registerAction, type RegisterFormState } from "./actions";

const initialState: RegisterFormState = { ok: true };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const [form, setForm] = React.useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
  });

  const [touched, setTouched] = React.useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [clientErrors, setClientErrors] = React.useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});
  const [clientSummary, setClientSummary] = React.useState<string[]>([]);

  function buildSummary(errors: Partial<Record<keyof RegisterInput, string>>) {
    const lines: string[] = [];
    if (errors.name) lines.push("• Nombre: mínimo 2 caracteres.");
    if (errors.email) lines.push("• Email: formato válido (ej: nombre@dominio.com).");
    if (errors.password) lines.push("• Contraseña: 8+ / mayúscula / minúscula / número.");
    return lines;
  }

  function validateClient(next: RegisterInput, opts?: { onlyTouched?: boolean }) {
    const parsed = registerSchema.safeParse(next);

    if (parsed.success) {
      setClientErrors({});
      setClientSummary([]);
      return true;
    }

    const fe = parsed.error.flatten().fieldErrors;
    const allErrors: Partial<Record<keyof RegisterInput, string>> = {
      name: fe.name?.[0],
      email: fe.email?.[0],
      password: fe.password?.[0],
    };

    const errors =
      opts?.onlyTouched
        ? {
            name: touched.name ? allErrors.name : undefined,
            email: touched.email ? allErrors.email : undefined,
            password: touched.password ? allErrors.password : undefined,
          }
        : allErrors;

    setClientErrors(errors);
    setClientSummary(buildSummary(allErrors)); 
    return false;
  }

  // Validación en vivo: cada vez que cambia el form
  React.useEffect(() => {
    validateClient(form, { onlyTouched: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, touched.name, touched.email, touched.password]);

  const serverErrorBox = state.formError ? (
    <div
      className="mt-4 rounded-md border p-3 text-sm"
      style={{ borderColor: "rgba(239, 68, 68, 0.6)" }}
      role="alert"
      aria-live="polite"
    >
      <p className="font-medium text-danger">No se pudo crear la cuenta</p>
      <p className="mt-1 text-danger">{state.formError}</p>
    </div>
  ) : null;

  const clientBox =
    clientSummary.length > 0 && Object.values(touched).some(Boolean) ? (
      <div
        className="mt-4 rounded-md border p-3 text-sm"
        style={{ borderColor: "rgba(239, 68, 68, 0.6)" }}
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium text-danger">Ajusta esto y listo:</p>
        <ul className="mt-2 space-y-1 text-danger">
          {clientSummary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-muted">
          Crea tu cuenta para guardar transcripciones y ajustes.
        </p>

        {serverErrorBox}
        {clientBox}

        <form
          action={formAction}
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            const ok = validateClient(form);
            if (!ok) {
              e.preventDefault();
              setTouched({ name: true, email: true, password: true });
              const first =
                (clientErrors.name && "name") ||
                (clientErrors.email && "email") ||
                (clientErrors.password && "password") ||
                "name";
              (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus?.();
            }
          }}
        >
          <Input
            name="name"
            label="Nombre"
            placeholder="Eric"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            error={state.fieldErrors?.name ?? clientErrors.name}
          />

          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="ejemplo@justwriteit.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            error={state.fieldErrors?.email ?? clientErrors.email}
          />

          <div className="grid gap-3">
            <Input
              name="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Mínimo 8 caracteres, mayúscula, minúscula y número."
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              error={state.fieldErrors?.password ?? clientErrors.password}
            />

            {/* Barra de fuerza */}
            <PasswordStrength password={form.password} />
          </div>

          <Button type="submit" isLoading={isPending}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link className="underline underline-offset-4" href="/login">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
