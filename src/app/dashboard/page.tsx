import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardHomePage() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-muted">
        Bienvenido. Desde aquí irás a transcribir, ver historial y ajustar tu cuenta.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard/transcribe-file">
          <Button>Transcribir archivo</Button>
        </Link>
        <Link href="/dashboard/transcribe-live">
          <Button variant="ghost">Transcribir en vivo</Button>
        </Link>
        <Link href="/dashboard/history">
          <Button variant="ghost">Ver historial</Button>
        </Link>
      </div>
    </div>
  );
}
