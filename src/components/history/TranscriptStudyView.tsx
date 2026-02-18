"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

type Props = {
  transcriptText: string;
  segments: WhisperSegment[];
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function TranscriptStudyView({ transcriptText, segments }: Props) {
  const [viewMode, setViewMode] = React.useState<"study" | "text">(
    segments.length > 0 ? "study" : "text"
  );

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {viewMode === "study" ? "Modo estudio (tiempos)" : "Texto transcrito"}
        </h2>

        {segments.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === "study" ? "primary" : "ghost"}
              onClick={() => setViewMode("study")}
            >
              Estudio
            </Button>
            <Button
              type="button"
              variant={viewMode === "text" ? "primary" : "ghost"}
              onClick={() => setViewMode("text")}
            >
              Texto
            </Button>
          </div>
        )}
      </div>

      {viewMode === "text" || segments.length === 0 ? (
        <pre className="mt-2 whitespace-pre-wrap rounded-md border p-4 text-sm">
          {transcriptText || "(sin texto)"}
        </pre>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-muted">
            Segmentos: {segments.length} · Cada línea indica el minuto exacto del audio.
          </div>

          <div className="max-h-[520px] overflow-auto rounded-md border p-3 text-sm">
            {segments.map((s) => (
              <div key={s.id} className="py-2 border-b last:border-b-0">
                <div className="text-xs text-muted">
                  {formatTime(s.start)} – {formatTime(s.end)}
                </div>
                <div className="whitespace-pre-wrap">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
