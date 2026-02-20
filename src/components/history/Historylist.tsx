import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, clampText } from "@/lib/format";
import { HistoryListActions } from "@/components/history/HistoryListActions";
import { HistoryTitleEdit } from "@/components/history/HistoryTitleEdit";
import {
  FileAudio,
  Mic,
  Calendar,
  Languages,
  ArrowUpRight,
} from "lucide-react";

type TranscriptionRow = {
  id: string;
  type: string;
  status: string;
  audio_filename: string | null;
  transcript_text: string | null;
  created_at: string | Date | number;
  language: string;
};

function typeIcon(type: string) {
  return type === "live" ? Mic : FileAudio;
}

function statusVariant(status: string): "default" | "accent" | "danger" | "outline" {
  if (status === "done") return "accent";
  if (status === "failed") return "danger";
  if (status === "processing") return "outline";
  return "default";
}

export function HistoryList({ rows }: { rows: TranscriptionRow[] }) {
  return (
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
                    className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border"
                    style={{
                      borderColor: "rgba(var(--accent),0.18)",
                      background: "rgba(var(--accent),0.08)",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="min-w-0 break-words">
                      <HistoryTitleEdit id={t.id} currentTitle={displayTitle} />
                    </div>

                    <Link
                      href={`/dashboard/history/${t.id}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-accent hover:underline underline-offset-4"
                    >
                      Ver detalles <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} aria-hidden="true" />
                        {formatDateTime(String(t.created_at))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Languages size={14} aria-hidden="true" />
                        {t.language}
                      </span>
                    </div>

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
  );
}