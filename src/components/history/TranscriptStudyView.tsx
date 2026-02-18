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

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function TranscriptStudyView({ transcriptText, segments, audioUrl }: Props) {
  const [viewMode, setViewMode] = React.useState<"study" | "text">(
    segments.length > 0 ? "study" : "text"
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);

  // ✅ Autoscroll refs
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // ✅ Search
  const [query, setQuery] = React.useState("");

  // ✅ Speed controls
  const [globalRate, setGlobalRate] = React.useState<number>(1);
  const [loopRate, setLoopRate] = React.useState<number>(1);

  // ✅ Loop segment state
  const [loopEnabled, setLoopEnabled] = React.useState(false);
  const [loopSegmentId, setLoopSegmentId] = React.useState<number | null>(null);

  const filteredSegments = React.useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, query]);

  // Segmento activo respecto al audio (lista total)
  const activeGlobalIndex = React.useMemo(() => {
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

  // Segmento activo dentro de lista filtrada
  const activeFilteredIndex = React.useMemo(() => {
    if (activeGlobalIndex < 0) return -1;
    if (filteredSegments.length === 0) return -1;

    const globalId = segments[activeGlobalIndex]?.id;
    if (globalId === undefined) return -1;

    return filteredSegments.findIndex((s) => s.id === globalId);
  }, [activeGlobalIndex, filteredSegments, segments]);

  const loopSegment = React.useMemo(() => {
    if (!loopEnabled || loopSegmentId == null) return null;
    return segments.find((s) => s.id === loopSegmentId) ?? null;
  }, [loopEnabled, loopSegmentId, segments]);

  function applyPlaybackRate() {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = loopEnabled ? loopRate : globalRate;
  }

  function seekTo(sec: number, autoplay: boolean) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, sec);
    applyPlaybackRate();
    if (autoplay) el.play().catch(() => null);
  }

  function startLoop(seg: WhisperSegment) {
    setLoopEnabled(true);
    setLoopSegmentId(seg.id);
    // al iniciar loop, salta al inicio y reproduce
    seekTo(seg.start, true);
  }

  function stopLoop() {
    setLoopEnabled(false);
    setLoopSegmentId(null);
    // vuelve a la velocidad global
    const el = audioRef.current;
    if (el) el.playbackRate = globalRate;
  }

  function isRowVisible(rowEl: HTMLElement, containerEl: HTMLElement) {
    const rowRect = rowEl.getBoundingClientRect();
    const contRect = containerEl.getBoundingClientRect();

    const margin = 24;
    const topOk = rowRect.top >= contRect.top + margin;
    const bottomOk = rowRect.bottom <= contRect.bottom - margin;

    return topOk && bottomOk;
  }

  // ✅ Autoscroll pro: solo si el activo se sale del contenedor
  React.useEffect(() => {
    if (viewMode !== "study") return;
    if (!audioUrl) return;
    if (activeFilteredIndex < 0) return;

    const container = listRef.current;
    const row = rowRefs.current[activeFilteredIndex];
    if (!container || !row) return;

    if (!isRowVisible(row, container)) {
      row.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeFilteredIndex, viewMode, audioUrl]);

  // Si cambia el filtro, reseteamos refs para evitar índices viejos
  React.useEffect(() => {
    rowRefs.current = [];
  }, [query]);

  // ✅ Aplicar playbackRate cuando cambien rates o loop
  React.useEffect(() => {
    applyPlaybackRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalRate, loopRate, loopEnabled]);

  // ✅ Loop real: si llega al final del segmento, vuelve al inicio
  React.useEffect(() => {
    if (!loopEnabled || !loopSegment) return;
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const t = el.currentTime;
      // margen para evitar “parpadeos”
      const epsilon = 0.05;
      if (t >= loopSegment.end - epsilon) {
        el.currentTime = loopSegment.start;
        // mantiene rate del loop
        el.playbackRate = loopRate;
        el.play().catch(() => null);
      }
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [loopEnabled, loopSegment, loopRate]);

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

      {/* ✅ Reproductor */}
      {audioUrl ? (
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
              {/* Velocidad global */}
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

              {/* Velocidad loop */}
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
            onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLAudioElement).currentTime)}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-md border p-3 text-sm text-muted">
          Esta transcripción no tiene <span className="text-fg font-medium">audio_url</span> guardado.
        </div>
      )}

      {viewMode === "text" || segments.length === 0 ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-md border p-4 text-sm">
          {transcriptText || "(sin texto)"}
        </pre>
      ) : (
        <div className="mt-4 space-y-2">
          {/* ✅ Buscador */}
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
                {filteredSegments.length} resultado{filteredSegments.length === 1 ? "" : "s"}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setQuery("")}
                disabled={!query}
              >
                Limpiar
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted">
            Segmentos totales: {segments.length}. Mostrando: {filteredSegments.length}.
          </div>

          <div
            ref={listRef}
            className="max-h-[520px] overflow-auto rounded-md border p-3 text-sm"
          >
            {filteredSegments.length === 0 ? (
              <div className="text-sm text-muted p-2">
                No hay coincidencias para “{query.trim()}”.
              </div>
            ) : (
              filteredSegments.map((s, idx) => {
                const isActive = idx === activeFilteredIndex;
                const isLoop = loopEnabled && loopSegmentId === s.id;

                return (
                  <div
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    key={s.id}
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
                        onClick={(e: React.MouseEvent) => {
  seekTo(s.start, !e.shiftKey);
}}
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

                    {isLoop ? (
                      <div className="mt-2 text-xs text-muted">
                        Loop activo: {formatTime(s.start)}–{formatTime(s.end)} · Velocidad loop:{" "}
                        <span className="text-fg font-medium">{loopRate}x</span>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
