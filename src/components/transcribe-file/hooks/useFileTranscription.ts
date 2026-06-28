"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "@/components/ui/Toast";
import type { Phase } from "@/components/transcribe/TranscriptionProgress";
import type { Transcription } from "@/lib/types/transcriptions";
import type { UsageStatus } from "@/lib/types/usage";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickErrorMessage(data: unknown, fallback: string) {
  return isObject(data) && typeof data.error === "string" ? data.error : fallback;
}

function isUsageStatus(v: unknown): v is UsageStatus {
  return (
    isObject(v) &&
    typeof v.plan === "string" &&
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
        message: `Tu plan permite audios de hasta ${usage.maxAudioFileSizeMb}MB.`,
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

    abortControllerRef.current = new AbortController();

    try {
      setProgress(10);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setLastAudioUrl(blob.url);

      setProgress(30);
      setPhase("transcribing");

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
        signal: abortControllerRef.current.signal,
      });

      setProgress(70);
      setPhase("saving");

      const data = await readJsonOrNull(res);
      if (isObject(data) && isUsageStatus(data.usage)) {
        setUsage(data.usage);
      }

      if (!res.ok) {
        setPhase("error");
        push({
          title: "Error",
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
      if (err instanceof Error && err.name === "AbortError") return;
      setPhase("error");
      push({ title: "Error", message: err instanceof Error ? err.message : "Fallo inesperado.", variant: "danger" });
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

