"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
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

  // pasar segments al hook (para que pueda resolver loopSegmentId)
  React.useEffect(() => {
    loop.setSegments(segments);
  }, [segments]); // eslint-disable-line react-hooks/exhaustive-deps

  // segmento activo según currentTime
  const activeSegmentId = React.useMemo(() => {
    if (segments.length === 0) return null;
    const t = currentTime;
    for (const s of segments) {
      if (t >= s.start && t < s.end) return s.id;
    }
    // si está entre segmentos, devuelve el último que empezó
    let last: number | null = null;
    for (const s of segments) {
      if (t >= s.start) last = s.id;
      else break;
    }
    return last;
  }, [segments, currentTime]);

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
        <pre className="mt-4 whitespace-pre-wrap rounded-md border p-4 text-sm">
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
