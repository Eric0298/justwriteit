"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { AudioPlayerPanel } from "./AudioPlayerPanel";
import { SegmentsPanel } from "./SegmentsPanel";
import { useAudioLoop } from "./hooks/useAudioLoop";
import { BookOpen, FileText } from "lucide-react";

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
  }, [segments]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            {viewMode === "study" ? "Modo estudio (karaoke)" : "Texto transcrito"}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Reproduce el audio y sigue el segmento activo. Activa loop para repetir.
          </p>
        </div>

        {segments.length > 0 && (
          <div
            className="inline-flex rounded-[var(--radius-md)] border p-1"
            style={{
              borderColor: "rgba(var(--accent),0.18)",
              background:
                "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.85))",
            }}
          >
            <Button
              type="button"
              variant={viewMode === "study" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("study")}
              className="rounded-[12px]"
            >
              <BookOpen size={16} aria-hidden="true" />
              Estudio
            </Button>

            <Button
              type="button"
              variant={viewMode === "text" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("text")}
              className="rounded-[12px]"
            >
              <FileText size={16} aria-hidden="true" />
              Texto
            </Button>
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
          className="mt-4 whitespace-pre-wrap rounded-[var(--radius-lg)] border p-4 text-sm shadow-[var(--shadow-sm)]"
          style={{
            borderColor: "rgba(var(--accent),0.14)",
            background:
              "linear-gradient(180deg, rgba(var(--card),0.95), rgba(var(--card),0.75))",
          }}
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
