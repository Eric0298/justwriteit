import Link from "next/link";
import { auth } from "@/../auth";
import { listUserTranscriptions } from "@/lib/queries/transcriptions";
import { countUserTranscriptions } from "@/lib/queries/transcription-extra";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, clampText } from "@/lib/format";
import { redirect } from "next/navigation";

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
    <Card className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Historial</h1>
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
          Aún no tienes transcripciones. Ve a <Link className="underline" href="/dashboard/transcribe-file">Transcribir archivo</Link>{" "}
          o <Link className="underline" href="/dashboard/transcribe-live">Transcribir en vivo</Link>.
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {rows.map((t) => {
            const preview = clampText(t.transcript_text ?? "(sin texto)", 160);

            return (
              <li key={t.id} className="rounded-[var(--radius-lg)] border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/history/${t.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {t.audio_filename ? t.audio_filename : `Transcripción ${t.type}`}
                    </Link>

                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(t.created_at)} · Idioma: {t.language}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge>{t.type}</Badge>
                    <Badge>{t.status}</Badge>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted break-words">{preview}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          aria-disabled={!canPrev}
          className={`text-sm underline underline-offset-4 ${!canPrev ? "pointer-events-none opacity-50" : ""}`}
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
          className={`text-sm underline underline-offset-4 ${!canNext ? "pointer-events-none opacity-50" : ""}`}
          href={`/dashboard/history?page=${page + 1}`}
        >
          Siguiente →
        </Link>
      </div>
    </Card>
  );
}
