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
  audioUrl?: string | null; 
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function TranscriptStudyView({ transcriptText, segments, audioUrl }: Props) {
  const [viewMode, setViewMode] = React.useState<"study" | "text">(
    segments.length > 0 ? "study" : "text"
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);

  const activeIndex = React.useMemo(() => {
    if (segments.length === 0) return -1;
    const t = currentTime;

    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (t >= s.start && t < s.end) return i;
    }

    let last = -1;
    for (let i = 0; i < segments.length; i++) {
      if (t >= segments[i].start) last = i;
      else break;
    }
    return last;
  }, [segments, currentTime]);

  function seekTo(sec: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, sec);
    el.play().catch(() => null);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {viewMode === "study" ? "Modo estudio (karaoke)" : "Texto transcrito"}
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

      {audioUrl ? (
        <div className="mt-3 rounded-md border p-3">
          <div className="text-xs text-muted mb-2">
            Reproducción sincronizada · Tiempo actual:{" "}
            <span className="text-fg font-medium">{formatTime(currentTime)}</span>
          </div>

          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={audioUrl}
            className="w-full"
            onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLAudioElement).currentTime)}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-md border p-3 text-sm text-muted">
          Esta transcripción no tiene <span className="text-fg font-medium">audio_url</span> guardado.
          (Solo podrás usar el modo texto/tiempos.)
        </div>
      )}

      {viewMode === "text" || segments.length === 0 ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-md border p-4 text-sm">
          {transcriptText || "(sin texto)"}
        </pre>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-muted">
            Segmentos: {segments.length} · Click en una línea para saltar a ese momento.
          </div>

          <div className="max-h-[520px] overflow-auto rounded-md border p-3 text-sm">
            {segments.map((s, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => seekTo(s.start)}
                  className={[
                    "w-full text-left py-2 px-2 rounded-md transition",
                    "border-b last:border-b-0",
                    isActive
                      ? "bg-accent/15 ring-1 ring-accent"
                      : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  <div className="text-xs text-muted">
                    {formatTime(s.start)} – {formatTime(s.end)}
                  </div>
                  <div className="whitespace-pre-wrap">{s.text}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
