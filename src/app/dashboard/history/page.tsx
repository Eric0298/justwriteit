// app/dashboard/history/page.tsx
import Link from "next/link";
import { auth } from "@/../auth";
import { listUserTranscriptions } from "@/lib/queries/transcriptions";
import { countUserTranscriptions } from "@/lib/queries/transcription-extra";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, clampText } from "@/lib/format";
import { redirect } from "next/navigation";
import { HistoryListActions } from "@/components/history/HistoryListActions";
import { HistoryTitleEdit } from "@/components/history/HistoryTitleEdit";

const PAGE_SIZE = 10;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    listUserTranscriptions({ userId: session.user.id, limit: PAGE_SIZE, offset }),
    countUserTranscriptions({ userId: session.user.id }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Historial</h1>
          <p className="mt-2 text-sm text-muted">
            Tus transcripciones (archivo y en vivo), ordenadas por fecha.
          </p>
        </div>

        <div className="text-sm text-muted">
          Total: <span className="text-fg font-medium">{total}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-muted">
          Aún no tienes transcripciones. Ve a{" "}
          <Link className="underline" href="/dashboard/transcribe-file">
            Transcribir archivo
          </Link>{" "}
          o{" "}
          <Link className="underline" href="/dashboard/transcribe-live">
            Transcribir en vivo
          </Link>
          .
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {rows.map((t) => {
            const preview = clampText(t.transcript_text ?? "(sin texto)", 160);
            const displayTitle = t.audio_filename || `Transcripción ${t.type}`;

            return (
              <li key={t.id} className="rounded-[var(--radius-lg)] border p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Contenido principal */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2">
                      {/* Título editable */}
                      <HistoryTitleEdit id={t.id} currentTitle={displayTitle} />
                      
                      {/* Enlace a detalle debajo del título */}
                      <Link
                        href={`/dashboard/history/${t.id}`}
                        className="text-xs text-muted hover:text-accent hover:underline"
                      >
                        Ver detalles →
                      </Link>
                    </div>

                    <p className="mt-2 text-xs text-muted">
                      {formatDateTime(t.created_at)} · Idioma: {t.language}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge>{t.type}</Badge>
                      <Badge>{t.status}</Badge>
                    </div>

                    <p className="mt-3 break-words text-sm text-muted">{preview}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end sm:flex-col sm:items-end sm:justify-start">
                    <HistoryListActions id={t.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          aria-disabled={!canPrev}
          className={`text-sm underline underline-offset-4 ${
            !canPrev ? "pointer-events-none opacity-50" : ""
          }`}
          href={`/dashboard/history?page=${page - 1}`}
        >
          ← Anterior
        </Link>

        <p className="text-sm text-muted">
          Página <span className="text-fg font-medium">{page}</span> de{" "}
          <span className="text-fg font-medium">{totalPages}</span>
        </p>

        <Link
          aria-disabled={!canNext}
          className={`text-sm underline underline-offset-4 ${
            !canNext ? "pointer-events-none opacity-50" : ""
          }`}
          href={`/dashboard/history?page=${page + 1}`}
        >
          Siguiente →
        </Link>
      </div>
    </Card>
  );
}