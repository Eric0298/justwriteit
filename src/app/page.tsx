import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function HomePage() {
  return (
    <main className="container-app py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">JustWriteIt</h1>
        <p className="mt-2 text-muted">
          Base lista: Next.js + TS + Tailwind + estilos propios.
        </p>

        <div className="mt-6 grid gap-4 max-w-md">
          <label className="grid gap-2">
            <span className="label">Email</span>
            <Input placeholder="elu@justwriteit.com" type="email" />
            <span className="hint">Esto es solo una demo visual.</span>
          </label>

          <div className="flex gap-3">
            <Button>Entrar</Button>
            <Button variant="ghost">Crear cuenta</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
