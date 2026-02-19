import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { auth } from "@/../auth";
import { redirect } from "next/navigation";

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const nombre = session.user.name ?? "Usuario";

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-muted">
        Bienvenido, <span className="font-semibold text-fg">{nombre}</span>.
        Aquí podrás transcribir tus archivos de audio a texto e incluso transcribir
        grabaciones de voz, además de usar el modo estudio para perfeccionar tu
        capacidad de escucha en diferentes idiomas. También puedes acceder a todas
        tus transcripciones desde el historial.
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