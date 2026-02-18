"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { WhisperSegment } from "./TranscriptStudyView";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function isRowVisible(rowEl: HTMLElement, containerEl: HTMLElement) {
  const rowRect = rowEl.getBoundingClientRect();
  const contRect = containerEl.getBoundingClientRect();
  const margin = 24;
  return rowRect.top >= contRect.top + margin && rowRect.bottom <= contRect.bottom - margin;
}

export function SegmentsPanel(props: {
  segments: WhisperSegment[];
  activeSegmentId: number | null;
  audioUrl?: string | null;

  seekTo: (sec: number, autoplay: boolean) => void;
  loopEnabled: boolean;
  loopSegmentId: number | null;
  startLoop: (seg: WhisperSegment) => void;
  stopLoop: () => void;
}) {
  const { segments, activeSegmentId, audioUrl, seekTo, loopEnabled, loopSegmentId, startLoop, stopLoop } = props;

  const [query, setQuery] = React.useState("");
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const filtered = React.useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, query]);

  const activeFilteredIndex = React.useMemo(() => {
    if (activeSegmentId == null) return -1;
    return filtered.findIndex((s) => s.id === activeSegmentId);
  }, [filtered, activeSegmentId]);

  // reset refs on query
  React.useEffect(() => {
    rowRefs.current = [];
  }, [query]);

  // autoscroll pro (solo si se sale)
  React.useEffect(() => {
    if (!audioUrl) return;
    if (activeFilteredIndex < 0) return;
    const container = listRef.current;
    const row = rowRefs.current[activeFilteredIndex];
    if (!container || !row) return;
    if (!isRowVisible(row, container)) row.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeFilteredIndex, audioUrl]);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="label text-xs" htmlFor="seg-search">
            Buscar en segmentos
          </label>
          <input
            id="seg-search"
            className="input"
            placeholder="Ej: rabbit, introduced, biodiversity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="hint">
            Click reproduce · <span className="font-medium">Shift+Click</span> solo salta · ↻ crea loop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </span>
          <Button type="button" variant="ghost" onClick={() => setQuery("")} disabled={!query}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted">
        Segmentos totales: {segments.length}. Mostrando: {filtered.length}.
      </div>

      <div ref={listRef} className="max-h-[520px] overflow-auto rounded-md border p-3 text-sm">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted p-2">No hay coincidencias para “{query.trim()}”.</div>
        ) : (
          filtered.map((s, idx) => {
            const isActive = s.id === activeSegmentId;
            const isLoop = loopEnabled && loopSegmentId === s.id;

            return (
              <div
                key={s.id}
                ref={(el) => {
                  rowRefs.current[idx] = el;
                }}
                className={[
                  "py-2 px-2 rounded-md transition",
                  "border-b last:border-b-0",
                  isActive ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted/30",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={(e: React.MouseEvent) => seekTo(s.start, !e.shiftKey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        seekTo(s.start, true);
                      }
                    }}
                    title="Click: reproducir · Shift+Click: solo saltar"
                  >
                    <div className="text-xs text-muted">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{s.text}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => seekTo(s.start, true)}
                      aria-label="Reproducir desde este segmento"
                      title="Reproducir desde aquí"
                    >
                      ▶
                    </button>

                    <button
                      type="button"
                      className={`btn btn-ghost btn-sm ${isLoop ? "ring-1 ring-accent" : ""}`}
                      onClick={() => (isLoop ? stopLoop() : startLoop(s))}
                      aria-label="Repetir este segmento en bucle"
                      title={isLoop ? "Parar loop de este segmento" : "Loop este segmento"}
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
