import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="container-app py-14">
      <div className="card p-8">
        <div className="max-w-2xl">
          <p className="text-sm text-muted">JustWriteIt</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Transcribe y escribe sin fricción.
          </h1>
          <p className="mt-3 text-muted">
            Una app enfocada a productividad: transcripción de audio, historial y ajustes.
            Base profesional lista para crecer (auth, DB, seguridad y deploy).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register">
              <Button>Crear cuenta</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Ver dashboard</Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="text-sm font-medium">Transcribe archivo</p>
              <p className="mt-1 text-sm text-muted">Sube audio y obtén texto.</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium">Transcribe en vivo</p>
              <p className="mt-1 text-sm text-muted">Captura voz y escribe.</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium">Historial</p>
              <p className="mt-1 text-sm text-muted">Encuentra y revisa sesiones.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
