"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { WhisperSegment } from "./TranscriptStudyView";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function AudioPlayerPanel(props: {
  audioUrl?: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  setCurrentTime: (t: number) => void;

  globalRate: number;
  setGlobalRate: (n: number) => void;
  loopRate: number;
  setLoopRate: (n: number) => void;

  loopEnabled: boolean;
  loopSegment: WhisperSegment | null;
  stopLoop: () => void;
}) {
  const {
    audioUrl,
    audioRef,
    currentTime,
    setCurrentTime,
    globalRate,
    setGlobalRate,
    loopRate,
    setLoopRate,
    loopEnabled,
    loopSegment,
    stopLoop,
  } = props;

  if (!audioUrl) {
    return (
      <div className="mt-3 rounded-md border p-3 text-sm text-muted">
        Esta transcripción no tiene <span className="text-fg font-medium">audio_url</span> guardado.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-xs text-muted">
          Tiempo actual:{" "}
          <span className="text-fg font-medium">{formatTime(currentTime)}</span>
          {loopEnabled && loopSegment ? (
            <>
              {" "}
              · Loop:{" "}
              <span className="text-fg font-medium">
                {formatTime(loopSegment.start)}–{formatTime(loopSegment.end)}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted">
            Velocidad
            <select
              className="input ml-2 h-9 py-1"
              value={String(globalRate)}
              onChange={(e) => setGlobalRate(Number(e.target.value))}
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted">
            Loop
            <select
              className="input ml-2 h-9 py-1"
              value={String(loopRate)}
              onChange={(e) => setLoopRate(Number(e.target.value))}
              disabled={!loopEnabled}
              title={!loopEnabled ? "Activa un loop para usar esta velocidad" : undefined}
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </label>

          {loopEnabled ? (
            <Button type="button" variant="danger" onClick={stopLoop}>
              Parar loop
            </Button>
          ) : null}
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={audioUrl}
        className="w-full mt-3"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
    </div>
  );
}
