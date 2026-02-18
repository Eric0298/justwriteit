"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { TranscriptStudyView } from "@/components/history/TranscriptStudyView";
import type { Transcription, WhisperSegment } from "@/lib/types/transcriptions";

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

export function TranscriptionResultCard(props: {
  result: Transcription;
  // Por si quieres usar la URL del blob inmediatamente
  fallbackAudioUrl?: string | null;
  // Por si el API te devuelve segments fuera de transcription (depende de tu implementación)
  segmentsRaw?: unknown;
}) {
  const { result, fallbackAudioUrl, segmentsRaw } = props;

  const segs = React.useMemo(() => {
    // preferimos result.segments si viene
    if (result.segments) return result.segments;
    // si no, intentamos parsear segmentsRaw (por compatibilidad)
    return parseSegments(segmentsRaw);
  }, [result.segments, segmentsRaw]);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-sm font-medium">Resultado</h2>

      <TranscriptStudyView
        transcriptText={result.transcript_text ?? ""}
        segments={segs}
        audioUrl={result.audio_url ?? fallbackAudioUrl ?? null}
      />
    </Card>
  );
}
