import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <main className="container-app py-14">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted">
          Accede para ver tu dashboard y tu historial.
        </p>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="label">Email</span>
            <Input type="email" placeholder="eric@justwriteit.com" autoComplete="email" />
          </label>

          <label className="grid gap-2">
            <span className="label">Contraseña</span>
            <Input type="password" placeholder="••••••••" autoComplete="current-password" />
          </label>

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
