"use client";

import * as React from "react";
import { AudioPlayerPanel } from "./AudioPlayerPanel";
import { SegmentsPanel } from "./SegmentsPanel";
import { useAudioLoop } from "./hooks/useAudioLoop";

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

export function TranscriptStudyView({ transcriptText, segments, audioUrl }: Props) {
  const [viewMode, setViewMode] = React.useState<"study" | "text">(
    segments.length > 0 ? "study" : "text"
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);

  const [globalRate, setGlobalRate] = React.useState<number>(1);
  const [loopRate, setLoopRate] = React.useState<number>(1);

  const loop = useAudioLoop({ audioRef, globalRate, loopRate });

  React.useEffect(() => {
    loop.setSegments(segments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  const activeSegmentId = React.useMemo(() => {
    if (segments.length === 0) return null;
    const t = currentTime;
    for (const s of segments) {
      if (t >= s.start && t < s.end) return s.id;
    }
    let last: number | null = null;
    for (const s of segments) {
      if (t >= s.start) last = s.id;
      else break;
    }
    return last;
  }, [segments, currentTime]);

  const canToggle = segments.length > 0;

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium">
          {viewMode === "study" ? "Modo estudio (karaoke)" : "Texto transcrito"}
        </h2>

        {canToggle && (
          // ✅ Segmented control PRO (siempre se ven las 2 opciones)
          <div
            className="w-full sm:w-auto"
            role="tablist"
            aria-label="Cambiar vista"
          >
            <div
              className="flex w-full sm:w-[240px] items-center gap-1 rounded-full border p-1"
              style={{
                borderColor: "rgb(var(--border))",
                background: "rgba(var(--card), 0.72)",
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "study"}
                onClick={() => setViewMode("study")}
                className={[
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]",
                  viewMode === "study"
                    ? "shadow-sm"
                    : "opacity-85 hover:opacity-100",
                ].join(" ")}
                style={
                  viewMode === "study"
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(var(--accent), 0.95), rgba(var(--accent-2), 0.88))",
                        color: "rgb(var(--primary-fg))",
                      }
                    : {
                        background: "transparent",
                        color: "rgb(var(--fg))",
                      }
                }
              >
                Estudio
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "text"}
                onClick={() => setViewMode("text")}
                className={[
                  "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]",
                  viewMode === "text"
                    ? "shadow-sm"
                    : "opacity-85 hover:opacity-100",
                ].join(" ")}
                style={
                  viewMode === "text"
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(var(--accent), 0.95), rgba(var(--accent-2), 0.88))",
                        color: "rgb(var(--primary-fg))",
                      }
                    : {
                        background: "transparent",
                        color: "rgb(var(--fg))",
                      }
                }
              >
                Texto
              </button>
            </div>
          </div>
        )}
      </div>

      <AudioPlayerPanel
        audioUrl={audioUrl}
        audioRef={audioRef}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        globalRate={globalRate}
        setGlobalRate={setGlobalRate}
        loopRate={loopRate}
        setLoopRate={setLoopRate}
        loopEnabled={loop.loopEnabled}
        loopSegment={loop.loopSegment}
        stopLoop={loop.stopLoop}
      />

      {viewMode === "text" || segments.length === 0 ? (
        <pre
          className="mt-4 whitespace-pre-wrap rounded-md border p-4 text-sm"
          style={{ borderColor: "rgb(var(--border))", background: "rgba(var(--card),0.82)" }}
        >
          {transcriptText || "(sin texto)"}
        </pre>
      ) : (
        <SegmentsPanel
          segments={segments}
          activeSegmentId={activeSegmentId}
          audioUrl={audioUrl}
          seekTo={loop.seekTo}
          loopEnabled={loop.loopEnabled}
          loopSegmentId={loop.loopSegmentId}
          startLoop={loop.startLoop}
          stopLoop={loop.stopLoop}
        />
      )}
    </div>
  );
}
