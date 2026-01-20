import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-muted">
          Crea tu cuenta para guardar transcripciones y ajustes.
        </p>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="label">Nombre</span>
            <Input type="text" placeholder="TuNombre" autoComplete="name" />
          </label>

          <label className="grid gap-2">
            <span className="label">Email</span>
            <Input type="email" placeholder="ejemplo@justwriteit.com" autoComplete="email" />
          </label>

          <label className="grid gap-2">
            <span className="label">Contraseña</span>
            <Input type="password" placeholder="••••••••" autoComplete="new-password" />
            <span className="hint">Mínimo 8 caracteres (validaremos con Zod más adelante).</span>
          </label>

          <Button type="submit">Crear cuenta</Button>
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
