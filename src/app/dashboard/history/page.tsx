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
import {
  History as HistoryIcon,
  FileAudio,
  Mic,
  Calendar,
  Languages,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const PAGE_SIZE = 10;

function typeIcon(type: string) {
  return type === "live" ? Mic : FileAudio;
}

function statusVariant(status: string): "default" | "accent" | "danger" | "outline" {
  if (status === "done") return "accent";
  if (status === "failed") return "danger";
  if (status === "processing") return "outline";
  return "default";
}

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
  <Card className="p-4 sm:p-6 min-w-0 overflow-x-hidden">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2">
            <span
              className="grid h-10 w-10 place-items-center rounded-[14px] border"
              style={{
                borderColor: "rgba(var(--accent),0.22)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--accent-2),0.10))",
              }}
              aria-hidden="true"
            >
              <HistoryIcon size={18} />
            </span>

            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">Historial</h1>
              <p className="mt-1 text-sm text-muted">
                Todas tus transcripciones (archivo y en vivo), ordenadas por fecha.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-3 py-2 text-sm sm:justify-end"
          style={{
            borderColor: "rgba(var(--accent),0.18)",
            background:
              "linear-gradient(180deg, rgba(var(--card),0.95), rgba(var(--card),0.75))",
          }}
        >
          <span className="inline-flex items-center gap-2 text-muted">
            <Sparkles size={16} aria-hidden="true" />
            Total
          </span>
          <span className="text-fg font-semibold">{total}</span>
        </div>
      </div>

      {/* ===== Empty state ===== */}
      {rows.length === 0 ? (
        <div
          className="mt-6 rounded-[var(--radius-lg)] border p-5 text-sm"
          style={{
            borderColor: "rgba(var(--accent),0.18)",
            background:
              "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.90))",
          }}
        >
          <p className="text-fg font-medium">Aún no tienes transcripciones.</p>
          <p className="mt-2 text-muted">
            Empieza por{" "}
            <Link className="underline underline-offset-4 hover:text-accent" href="/dashboard/transcribe-file">
              transcribir un archivo
            </Link>{" "}
            o{" "}
            <Link className="underline underline-offset-4 hover:text-accent" href="/dashboard/transcribe-live">
              transcribir en vivo
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {/* ===== List ===== */}
          <ul className="mt-6 grid gap-3 min-w-0">
            {rows.map((t) => {
              const preview = clampText(t.transcript_text ?? "(sin texto)", 160);
              const displayTitle = t.audio_filename || `Transcripción ${t.type}`;
              const Icon = typeIcon(t.type);

              return (
                <li
                  key={t.id}
                 className="rounded-[var(--radius-lg)] border p-3 sm:p-4 transition hover:shadow-[var(--shadow-sm)] min-w-0"

                  style={{
                    borderColor: "rgba(var(--accent),0.14)",
                    background:
                      "linear-gradient(180deg, rgba(var(--card),0.96), rgba(var(--card),0.78))",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 grid h-10 w-10 place-items-center rounded-[14px] border"
                          style={{
                            borderColor: "rgba(var(--accent),0.18)",
                            background: "rgba(var(--accent),0.08)",
                          }}
                          aria-hidden="true"
                        >
                          <Icon size={18} />
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Title editable */}
<div className="min-w-0 break-words">
  <HistoryTitleEdit id={t.id} currentTitle={displayTitle} />
</div>

                          {/* Link to detail */}
                          <Link
                            href={`/dashboard/history/${t.id}`}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-accent hover:underline underline-offset-4"
                          >
                            Ver detalles <ArrowUpRight size={14} aria-hidden="true" />
                          </Link>

                          {/* Meta */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={14} aria-hidden="true" />
                              {formatDateTime(t.created_at)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Languages size={14} aria-hidden="true" />
                              {t.language}
                            </span>
                          </div>

                          {/* Badges */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{t.type}</Badge>
                            <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                          </div>

                          <p className="mt-3 break-words text-sm text-muted">{preview}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center justify-end sm:flex-col sm:items-end sm:justify-start">
                      <HistoryListActions id={t.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ===== Pagination ===== */}
          <div
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              aria-disabled={!canPrev}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition",
                !canPrev ? "pointer-events-none opacity-50" : "hover:shadow-[var(--shadow-sm)]",
              ].join(" ")}
              style={{
                borderColor: "rgba(var(--accent),0.16)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.85))",
              }}
              href={`/dashboard/history?page=${page - 1}`}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Anterior
            </Link>

            <p className="text-sm text-muted text-center">
              Página <span className="text-fg font-semibold">{page}</span> de{" "}
              <span className="text-fg font-semibold">{totalPages}</span>
            </p>

            <Link
              aria-disabled={!canNext}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition",
                !canNext ? "pointer-events-none opacity-50" : "hover:shadow-[var(--shadow-sm)]",
              ].join(" ")}
              style={{
                borderColor: "rgba(var(--accent),0.16)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.85))",
              }}
              href={`/dashboard/history?page=${page + 1}`}
            >
              Siguiente
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}
