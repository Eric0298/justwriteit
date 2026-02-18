import Link from "next/link";
import { auth } from "@/../auth";
import { getUserTranscriptionById } from "@/lib/queries/transcriptions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { notFound, redirect } from "next/navigation";
import { HistoryActions } from "@/components/history/HistoryActions";
import { TranscriptStudyView, type WhisperSegment } from "@/components/history/TranscriptStudyView";
import { ArrowLeft, Calendar, Languages, FileAudio, Mic } from "lucide-react";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSegment(v: unknown): v is WhisperSegment {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "number" &&
    typeof v.start === "number" &&
    typeof v.end === "number" &&
    typeof v.text === "string"
  );
}

function normalizeSegments(raw: unknown): WhisperSegment[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isSegment) : [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw.filter(isSegment);
  }

  return [];
}

function statusVariant(status: string): "default" | "accent" | "danger" | "outline" {
  if (status === "done") return "accent";
  if (status === "failed") return "danger";
  if (status === "processing") return "outline";
  return "default";
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const row = await getUserTranscriptionById({ userId: session.user.id, id });
  if (!row) notFound();

  const segments = normalizeSegments(row.segments);
  const TypeIcon = row.type === "live" ? Mic : FileAudio;

  return (
    <Card className="p-4 sm:p-6">
      {/* ===== Top bar ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent hover:underline underline-offset-4"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al historial
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border"
              style={{
                borderColor: "rgba(var(--accent),0.22)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.16), rgba(var(--accent-2),0.10))",
              }}
              aria-hidden="true"
            >
              <TypeIcon size={20} />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold break-words">
                {row.audio_filename ? row.audio_filename : `Transcripción ${row.type}`}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={16} aria-hidden="true" />
                  {formatDateTime(row.created_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Languages size={16} aria-hidden="true" />
                  {row.language}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{row.type}</Badge>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                {segments.length > 0 ? (
                  <Badge variant="accent">{segments.length} segmentos</Badge>
                ) : (
                  <Badge variant="default">sin segmentos</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sm:mt-1">
          <HistoryActions id={row.id} transcriptText={row.transcript_text ?? ""} />
        </div>
      </div>

      {/* ===== Study view ===== */}
      <div className="mt-6">
        <TranscriptStudyView
          transcriptText={row.transcript_text ?? ""}
          segments={segments}
          audioUrl={row.audio_url}
        />
      </div>
    </Card>
  );
}
