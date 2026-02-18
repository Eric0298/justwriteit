import Link from "next/link";
import { auth } from "@/../auth";
import { getUserTranscriptionById } from "@/lib/queries/transcriptions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { notFound, redirect } from "next/navigation";
import { HistoryActions } from "@/components/history/HistoryActions";
import { TranscriptStudyView, type WhisperSegment } from "@/components/history/TranscriptStudyView";

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

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard/history"
            className="text-sm text-muted underline underline-offset-4"
          >
            ← Volver al historial
          </Link>

          <h1 className="mt-3 text-2xl font-semibold break-words">
            {row.audio_filename ? row.audio_filename : `Transcripción ${row.type}`}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {formatDateTime(row.created_at)} · Idioma: {row.language}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Badge>{row.type}</Badge>
            <Badge>{row.status}</Badge>
          </div>
        </div>

        <HistoryActions id={row.id} transcriptText={row.transcript_text ?? ""} />
      </div>

      <TranscriptStudyView
        transcriptText={row.transcript_text ?? ""}
        segments={segments}
      />
    </Card>
  );
}
