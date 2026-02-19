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
      <p className="mt-2 text-sm text-muted leading-relaxed">
  Hola, <span className="font-semibold text-fg">{nombre}</span>.  
  Tu centro de trabajo: transcribe archivos o grabaciones en vivo, organiza todo en el historial
  y usa el <span className="font-medium text-fg">modo estudio</span> para practicar idiomas con precisión.
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