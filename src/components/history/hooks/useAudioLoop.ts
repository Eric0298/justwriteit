"use client";

import * as React from "react";
import type { WhisperSegment } from "../TranscriptStudyView";

export function useAudioLoop(opts: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  globalRate: number;
  loopRate: number;
}) {
  const { audioRef, globalRate, loopRate } = opts;

  const [loopEnabled, setLoopEnabled] = React.useState(false);
  const [loopSegmentId, setLoopSegmentId] = React.useState<number | null>(null);
  const [segments, setSegments] = React.useState<WhisperSegment[]>([]);

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
    seekTo(seg.start, true);
  }

  function stopLoop() {
    setLoopEnabled(false);
    setLoopSegmentId(null);
    const el = audioRef.current;
    if (el) el.playbackRate = globalRate;
  }

  // aplica rate al cambiar velocidades o loop
  React.useEffect(() => {
    applyPlaybackRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalRate, loopRate, loopEnabled]);

  // loop real: vuelve al inicio al llegar al final
  React.useEffect(() => {
    if (!loopEnabled || !loopSegment) return;
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const t = el.currentTime;
      const epsilon = 0.05;
      if (t >= loopSegment.end - epsilon) {
        el.currentTime = loopSegment.start;
        el.playbackRate = loopRate;
        el.play().catch(() => null);
      }
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [loopEnabled, loopSegment, loopRate, audioRef]);

  return {
    loopEnabled,
    loopSegmentId,
    loopSegment,
    setSegments,
    startLoop,
    stopLoop,
    seekTo,
    applyPlaybackRate,
  };
}
