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
import { UserPlus, User, Mail, Lock, ArrowRight } from "lucide-react";

const initialState: RegisterFormState = { ok: true };

export default function RegisterClient() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const [form, setForm] = React.useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
  });

  const [touched, setTouched] = React.useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [clientErrors, setClientErrors] = React.useState<Partial<Record<keyof RegisterInput, string>>>({});
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

  React.useEffect(() => {
    validateClient(form, { onlyTouched: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, touched.name, touched.email, touched.password]);

  const serverErrorBox = state.formError ? (
    <div className="alert alert-danger mt-4" role="alert" aria-live="polite">
      <p className="font-medium">No se pudo crear la cuenta</p>
      <p className="mt-1">{state.formError}</p>
    </div>
  ) : null;

  const clientBox =
    clientSummary.length > 0 && Object.values(touched).some(Boolean) ? (
      <div className="alert alert-warn mt-4" role="alert" aria-live="polite">
        <ul className="mt-2 space-y-1">
          {clientSummary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="w-full max-w-md">
      <div className="auth-card p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[16px] auth-badge">
            <UserPlus size={20} aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted">
            Crea tu cuenta para guardar transcripciones y ajustes.
          </p>
        </div>

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
          <div className="relative">
            <span className="input-icon" aria-hidden="true">
              <User size={16} />
            </span>
            <Input
              name="name"
              label="Nombre"
              placeholder="Eric"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, name: true }))}
              error={state.fieldErrors?.name ?? clientErrors.name}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <span className="input-icon" aria-hidden="true">
              <Mail size={16} />
            </span>
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
              className="pl-10"
            />
          </div>

          <div className="grid gap-3">
            <div className="relative">
              <span className="input-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
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
                className="pl-10"
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border p-4"
                 style={{
                   borderColor: "rgba(var(--accent),0.16)",
                   background: "linear-gradient(180deg, rgba(var(--card),0.92), rgba(var(--card),0.98))",
                 }}>
              <PasswordStrength password={form.password} />
            </div>
          </div>

          <Button type="submit" isLoading={isPending} className="w-full">
            <span>Crear cuenta</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link className="link-soft" href="/login">
            Iniciar sesión
          </Link>
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Al registrarte aceptas guardar transcripciones en tu cuenta.
      </p>
    </div>
  );
}
