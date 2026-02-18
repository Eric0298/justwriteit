"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "@/components/ui/Toast";
import { TranscriptionProgress, type Phase } from "@/components/transcribe/TranscriptionProgress";

import { TranscribeFileForm } from "@/components/transcribe/TranscribeFileForm";
import { TranscriptionResultCard } from "@/components/transcribe/TranscriptionResultCard";

import type { Transcription } from "@/lib/types/transcriptions";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickErrorMessage(data: unknown, fallback: string) {
  return isObject(data) && typeof data.error === "string" ? data.error : fallback;
}

export default function TranscribeFilePage() {
  const { push } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<Transcription | null>(null);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // ✅ para poder escuchar el audio inmediatamente aunque el backend aún no lo devuelva
  const [lastAudioUrl, setLastAudioUrl] = React.useState<string | null>(null);

  // ✅ compatibilidad: por si el endpoint devuelve segments fuera de `transcription`
  const [segmentsRaw, setSegmentsRaw] = React.useState<unknown>(null);

  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPhase("idle");
    setProgress(0);
    push({
      title: "Cancelado",
      message: "Transcripción cancelada.",
      variant: "danger",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      push({
        title: "Falta archivo",
        message: "Selecciona un audio para transcribir.",
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
      // 1) Subida a Vercel Blob
      setProgress(10);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setLastAudioUrl(blob.url);

      setProgress(30);
      setPhase("transcribing");

      // 2) Pedir transcripción
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

      const rawText = await res.text();
      const data: unknown = rawText
        ? (() => {
            try {
              return JSON.parse(rawText);
            } catch {
              return null;
            }
          })()
        : null;

      if (!res.ok) {
        setPhase("error");
        push({
          title: "Error",
          message: data ? pickErrorMessage(data, rawText || "No se pudo transcribir.") : rawText || "No se pudo transcribir.",
          variant: "danger",
        });
        return;
      }

      if (!data || !isObject(data) || data.ok !== true || !isObject(data.transcription)) {
        setPhase("error");
        push({
          title: "Error",
          message: "Respuesta inválida del servidor.",
          variant: "danger",
        });
        return;
      }

      // ✅ resultado principal
      const t = data.transcription as Transcription;
      setResult(t);

      // ✅ compat: segments podrían venir fuera
      if ("segments" in data) {
        setSegmentsRaw((data as Record<string, unknown>).segments);
      }

      setProgress(100);
      setPhase("done");

      push({
        title: "Transcripción lista ✅",
        message: "Guardada en tu historial.",
        variant: "success",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setPhase("error");
      push({
        title: "Error",
        message: err instanceof Error ? err.message : "Fallo inesperado.",
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TranscribeFileForm
        statusBadge={result?.status ?? "—"}
        isLoading={isLoading}
        file={file}
        setFile={setFile}
        language={language}
        setLanguage={setLanguage}
        context={context}
        setContext={setContext}
        onSubmit={onSubmit}
      />

      {(isLoading || phase === "done" || phase === "error") && (
        <TranscriptionProgress phase={phase} progress={progress} isBusy={isLoading} onCancel={handleCancel} />
      )}

      {result?.transcript_text && (
        <TranscriptionResultCard
          result={result}
          fallbackAudioUrl={lastAudioUrl}
          segmentsRaw={segmentsRaw}
        />
      )}
    </div>
  );
}
