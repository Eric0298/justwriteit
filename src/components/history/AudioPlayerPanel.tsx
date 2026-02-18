"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { WhisperSegment } from "./TranscriptStudyView";
import { Headphones, Gauge, Repeat, Square, Waves } from "lucide-react";

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
      <div
        className="mt-4 rounded-[var(--radius-lg)] border p-4 text-sm"
        style={{
          borderColor: "rgba(var(--accent),0.25)",
          background:
            "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.90))",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-[14px] border"
            style={{
              borderColor: "rgba(var(--accent),0.25)",
              background: "rgba(var(--accent),0.10)",
            }}
            aria-hidden="true"
          >
            <Headphones size={18} />
          </span>

          <div className="min-w-0">
            <p className="font-medium text-fg">Audio no disponible</p>
            <p className="mt-1 text-muted">
              Esta transcripción no tiene <span className="font-medium text-fg">audio_url</span>{" "}
              guardado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)]"
      style={{
        borderColor: "rgba(var(--accent),0.18)",
        background:
          "linear-gradient(180deg, rgba(var(--card),0.95), rgba(var(--card),0.75))",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-xs text-muted">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1"
              style={{
                borderColor: "rgba(var(--accent),0.22)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--accent-2),0.06))",
              }}
            >
              <Waves size={14} aria-hidden="true" />
              <span>
                Tiempo: <span className="text-fg font-semibold">{formatTime(currentTime)}</span>
              </span>
            </span>

            {loopEnabled && loopSegment ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-1"
                style={{
                  borderColor: "rgba(var(--accent),0.22)",
                  background: "rgba(var(--accent),0.08)",
                }}
              >
                <Repeat size={14} aria-hidden="true" />
                <span className="text-fg font-medium">
                  Loop {formatTime(loopSegment.start)}–{formatTime(loopSegment.end)}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Gauge size={14} aria-hidden="true" />
              Velocidad
            </span>
            <select
              className="input h-9 py-1 w-[92px]"
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

          <label className="text-xs text-muted flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Repeat size={14} aria-hidden="true" />
              Loop
            </span>
            <select
              className="input h-9 py-1 w-[92px]"
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
              <Square size={16} aria-hidden="true" />
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
        className="w-full mt-4 rounded-md"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
    </div>
  );
}
