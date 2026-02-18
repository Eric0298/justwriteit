"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TranscriptStudyView } from "@/components/history/TranscriptStudyView";
import type { Transcription, WhisperSegment } from "@/lib/types/transcriptions";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  AudioLines,
  ListMusic,
  Copy,
  ExternalLink,
} from "lucide-react";

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

function parseSegments(raw: unknown): WhisperSegment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isSegment);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isSegment) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function statusVariant(status?: string): "default" | "accent" | "danger" | "outline" {
  if (status === "done") return "accent";
  if (status === "failed") return "danger";
  if (status === "processing") return "outline";
  return "default";
}

export function TranscriptionResultCard(props: {
  result: Transcription;
  fallbackAudioUrl?: string | null;
  segmentsRaw?: unknown;
}) {
  const { result, fallbackAudioUrl, segmentsRaw } = props;

  const segs = React.useMemo(() => {
    if (result.segments) return result.segments;
    return parseSegments(segmentsRaw);
  }, [result.segments, segmentsRaw]);

  const audioUrl = result.audio_url ?? fallbackAudioUrl ?? null;

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(result.transcript_text ?? "");
      // sin toast aquí, porque este componente no usa useToast (mantengo lógica intacta)
    } catch {
      // ignore
    }
  }

  return (
    <Card
      className="p-4 sm:p-6"
      style={{
        borderColor: "rgba(var(--accent),0.16)",
        background:
          "linear-gradient(180deg, rgba(var(--card),0.96), rgba(var(--card),0.82))",
      }}
    >
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
              <AudioLines size={18} />
            </span>

            <div>
              <h2 className="text-sm font-semibold">Resultado</h2>
              <p className="mt-1 text-xs text-muted">
                Texto + segmentos (si el proveedor los devuelve).
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(result.status)}>
              <span className="inline-flex items-center gap-2">
                <Sparkles size={14} aria-hidden="true" />
                {result.status ?? "—"}
              </span>
            </Badge>

            <Badge variant={segs.length > 0 ? "accent" : "default"}>
              <span className="inline-flex items-center gap-2">
                <ListMusic size={14} aria-hidden="true" />
                {segs.length > 0 ? `${segs.length} segmentos` : "sin segmentos"}
              </span>
            </Badge>

            {audioUrl ? (
              <Badge variant="outline">audio OK</Badge>
            ) : (
              <Badge variant="danger">audio missing</Badge>
            )}
          </div>
        </div>

        {/* ===== Quick actions (UI only) ===== */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button variant="ghost" type="button" onClick={copyAll} aria-label="Copiar todo el texto">
            <Copy size={16} aria-hidden="true" />
            Copiar
          </Button>

          {result.id ? (
            <a
              href={`/dashboard/history/${result.id}`}
              className="btn btn-ghost"
              aria-label="Abrir en historial"
              style={{
                border: "1px solid rgba(var(--accent),0.16)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.88))",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <ExternalLink size={16} aria-hidden="true" />
                Abrir
              </span>
            </a>
          ) : null}
        </div>
      </div>

      {/* ===== Study view (misma lógica) ===== */}
      <TranscriptStudyView
        transcriptText={result.transcript_text ?? ""}
        segments={segs}
        audioUrl={audioUrl}
      />
    </Card>
  );
}
