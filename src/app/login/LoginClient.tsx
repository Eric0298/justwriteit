"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function LoginClient({ registered }: { registered: boolean }) {
  const { push } = useToast();

  React.useEffect(() => {
    if (registered) {
      push({
        title: "Cuenta creada ✅",
        message: "Ya puedes iniciar sesión.",
        variant: "success",
        durationMs: 3500,
      });
    }
  }, [registered, push]);

  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted">Accede a tu dashboard.</p>

        <form className="mt-6 grid gap-4">
          <Input name="email" label="Email" type="email" autoComplete="email" />
          <Input
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
          />
          <Button type="submit">Entrar</Button>
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
