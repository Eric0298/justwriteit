import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <p className="mt-2 text-sm text-muted">
        Preferencias del usuario (mock por ahora).
      </p>

      <form className="mt-6 grid max-w-lg gap-4">
        <label className="grid gap-2">
          <span className="label">Nombre</span>
          <Input placeholder="Elu" />
        </label>

        <label className="grid gap-2">
          <span className="label">Email</span>
          <Input type="email" placeholder="elu@justwriteit.com" />
        </label>

        <div className="flex gap-3">
          <Button type="submit">Guardar</Button>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
