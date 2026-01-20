import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Detalle</h1>
          <p className="mt-1 text-sm text-muted">ID: {id}</p>
        </div>

        <Link href="/dashboard/history">
          <Button variant="ghost">Volver</Button>
        </Link>
      </div>

      <div className="mt-6 rounded-md border p-4" style={{ borderColor: "rgb(var(--border))" }}>
        <p className="text-sm text-muted">
          Aquí irá el texto transcrito, metadatos, exportación, etc.
        </p>
      </div>
    </div>
  );
}
