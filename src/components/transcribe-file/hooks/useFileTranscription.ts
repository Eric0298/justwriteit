"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "@/components/ui/Toast";
import type { Phase } from "@/components/transcribe/TranscriptionProgress";
import type { Transcription } from "@/lib/types/transcriptions";
import type { UsageStatus } from "@/lib/types/usage";
import {
  MAX_AUDIO_DURATION_MINUTES,
  MAX_AUDIO_DURATION_SECONDS,
} from "@/lib/usage/limits";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickErrorMessage(data: unknown, fallback: string) {
  return isObject(data) && typeof data.error === "string" ? data.error : fallback;
}

function pickErrorCode(data: unknown): string | null {
  return isObject(data) && typeof data.code === "string" ? data.code : null;
}

async function readAudioDurationSec(file: File): Promise<number | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    let done = false;
    const finish = (val: number | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(val);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(null);
    // Algunos webm no disparan loadedmetadata; corta a los 5 s y deja decidir al servidor.
    window.setTimeout(() => finish(null), 5_000);
    audio.src = url;
  });
}

function isUsageStatus(v: unknown): v is UsageStatus {
  return (
    isObject(v) &&
    typeof v.remainingToday === "number" &&
    typeof v.dailyLimit === "number" &&
    typeof v.maxAudioFileSizeBytes === "number" &&
    typeof v.canTranscribe === "boolean" &&
    typeof v.message === "string"
  );
}

async function readJsonOrNull(res: Response): Promise<unknown> {
  const rawText = await res.text();
  if (!rawText) return null;
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return null;
  }
}

export function useFileTranscription() {
  const { push } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<Transcription | null>(null);
  const [usage, setUsage] = React.useState<UsageStatus | null>(null);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [lastAudioUrl, setLastAudioUrl] = React.useState<string | null>(null);
  const [segmentsRaw, setSegmentsRaw] = React.useState<unknown>(null);

  const refreshUsage = React.useCallback(async () => {
    const res = await fetch("/api/usage/today", { cache: "no-store" });
    const data = await readJsonOrNull(res);
    if (isObject(data) && isUsageStatus(data.usage)) {
      setUsage(data.usage);
    }
  }, []);

  React.useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  function cancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPhase("idle");
    setProgress(0);
    push({ title: "Cancelado", message: "Transcripcion cancelada.", variant: "danger" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (isLoading) return;

    if (!file) {
      push({ title: "Falta archivo", message: "Selecciona un audio para transcribir.", variant: "danger" });
      return;
    }

    if (usage && !usage.canTranscribe) {
      push({ title: "Limite diario alcanzado", message: usage.message, variant: "danger" });
      return;
    }

    if (usage && file.size > usage.maxAudioFileSizeBytes) {
      push({
        title: "Archivo demasiado grande",
        message: `El limite por archivo es de ${usage.maxAudioFileSizeMb}MB.`,
        variant: "danger",
      });
      return;
    }

    const durationSec = await readAudioDurationSec(file);
    if (durationSec !== null && Number.isFinite(durationSec) && durationSec > MAX_AUDIO_DURATION_SECONDS) {
      push({
        title: "Audio demasiado largo",
        message: `La duración máxima es de ${MAX_AUDIO_DURATION_MINUTES} minutos.`,
        variant: "danger",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSegmentsRaw(null);
    setLastAudioUrl(null);
    setPhase("uploading");
    setProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setProgress(10);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setLastAudioUrl(blob.url);

      setProgress(30);
      setPhase("transcribing");

      push({
        title: "Transcribiendo…",
        message: "Puede tardar hasta 3 minutos, sobre todo si el servicio estaba en reposo.",
        durationMs: 60_000,
      });

      const res = await fetch("/api/transcribe/file", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileUrl: blob.url,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          language,
          context,
        }),
        signal: controller.signal,
      });

      setProgress(70);
      setPhase("saving");

      const data = await readJsonOrNull(res);
      if (isObject(data) && isUsageStatus(data.usage)) {
        setUsage(data.usage);
      }

      if (!res.ok) {
        setPhase("error");
        const code = pickErrorCode(data);
        const title =
          code === "whisper_cold_start"
            ? "Servicio arrancando"
            : code === "whisper_too_large"
              ? "Audio no admitido"
              : "Error";
        push({
          title,
          message: pickErrorMessage(data, "No se pudo transcribir."),
          variant: "danger",
        });
        return;
      }

      if (!data || !isObject(data) || data.ok !== true || !isObject(data.transcription)) {
        setPhase("error");
        push({ title: "Error", message: "Respuesta invalida del servidor.", variant: "danger" });
        return;
      }

      const t = data.transcription as Transcription;
      setResult(t);

      if (isObject(data.transcription) && "segments" in data.transcription) {
        setSegmentsRaw((data.transcription as Record<string, unknown>).segments);
      }

      setProgress(100);
      setPhase("done");
      push({ title: "Transcripcion lista", message: "Guardada en tu historial.", variant: "success" });
    } catch (err) {
      const isManualAbort =
        err instanceof Error && err.name === "AbortError" && controller.signal.aborted;
      if (isManualAbort) return;
      setPhase("error");
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      const message = isTimeout
        ? "La subida tardó demasiado. Revisa tu conexión e intenta de nuevo."
        : err instanceof Error
          ? err.message
          : "Fallo inesperado.";
      push({ title: "Error", message, variant: "danger" });
      await refreshUsage().catch(() => undefined);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  return {
    file,
    setFile,
    language,
    setLanguage,
    context,
    setContext,
    isLoading,
    result,
    usage,
    phase,
    progress,
    lastAudioUrl,
    segmentsRaw,
    submit,
    cancel,
    refreshUsage,
  };
}

