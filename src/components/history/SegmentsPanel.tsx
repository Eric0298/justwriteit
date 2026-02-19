"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { WhisperSegment } from "./TranscriptStudyView";
import { Search, XCircle, Play, Repeat } from "lucide-react";

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

  React.useEffect(() => {
    rowRefs.current = [];
  }, [query]);

  React.useEffect(() => {
    if (!audioUrl) return;
    if (activeFilteredIndex < 0) return;
    const container = listRef.current;
    const row = rowRefs.current[activeFilteredIndex];
    if (!container || !row) return;
    if (!isRowVisible(row, container)) row.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeFilteredIndex, audioUrl]);

  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label className="label text-xs" htmlFor="seg-search">
            Buscar en segmentos
          </label>

          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
              aria-hidden="true"
            />
            <input
              id="seg-search"
              className="input pl-9"
              placeholder="Ej: rabbit, introduced, biodiversity..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                title="Limpiar"
              >
                <XCircle size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <p className="hint">
            Click reproduce · <span className="font-medium">Shift+Click</span> solo salta · ↻ crea loop
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
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

      <div
        ref={listRef}
        className="max-h-[520px] overflow-auto rounded-[var(--radius-lg)] border p-2 text-sm shadow-[var(--shadow-sm)]"
        style={{
          borderColor: "rgba(var(--accent),0.16)",
          background:
            "linear-gradient(180deg, rgba(var(--card),0.95), rgba(var(--card),0.72))",
        }}
      >
        {filtered.length === 0 ? (
          <div className="text-sm text-muted p-3">
            No hay coincidencias para “{query.trim()}”.
          </div>
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
                  "group rounded-[var(--radius-md)] p-3 transition",
                  "border mb-2 last:mb-0",
                  isActive ? "segment-active" : "segment-item",
                ].join(" ")}
                style={{
                  borderColor: isActive ? "rgba(var(--accent),0.38)" : "rgba(var(--border),0.95)",
                }}
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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1"
                        style={{
                          borderColor: "rgba(var(--accent),0.20)",
                          background: "rgba(var(--accent),0.08)",
                        }}
                      >
                        {formatTime(s.start)} – {formatTime(s.end)}
                      </span>

                      {isLoop ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-1"
                          style={{
                            borderColor: "rgba(var(--accent),0.24)",
                            background:
                              "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--accent-2),0.10))",
                          }}
                        >
                          <Repeat size={14} aria-hidden="true" />
                          Loop activo
                        </span>
                      ) : null}
                    </div>

                    <div
  className={[
    "mt-2 whitespace-pre-wrap break-words text-sm",
    isActive ? "segment-active-text" : "text-fg/90",
  ].join(" ")}
>
  {s.text}
</div>

                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => seekTo(s.start, true)}
                      aria-label="Reproducir desde este segmento"
                      title="Reproducir desde aquí"
                    >
                      <Play size={16} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className={`btn btn-ghost btn-sm ${isLoop ? "ring-1 ring-accent" : ""}`}
                      onClick={() => (isLoop ? stopLoop() : startLoop(s))}
                      aria-label="Repetir este segmento en bucle"
                      title={isLoop ? "Parar loop de este segmento" : "Loop este segmento"}
                    >
                      <Repeat size={16} aria-hidden="true" />
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
