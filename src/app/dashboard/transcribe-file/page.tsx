"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { TranscriptionProgress, type Phase } from "@/components/transcribe/TranscriptionProgress";

type Transcription = {
  id: string;
  status: string;
  language: string;
  audio_filename: string | null;
  duration: number | null;
  transcript_text: string | null;
  created_at: string;
};

type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickErrorMessage(data: unknown, fallback: string) {
  return isObject(data) && typeof data.error === "string" ? data.error : fallback;
}

function isSegment(v: unknown): v is WhisperSegment {
  if (!isObject(v)) return false;
  return (
    typeof v.id === "number" &&
    typeof v.start === "number" &&
    typeof v.end === "number" &&
    typeof v.text === "string"
  );
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function TranscribeFilePage() {
  const { push } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<Transcription | null>(null);

  const [segments, setSegments] = React.useState<WhisperSegment[]>([]);
  const [viewMode, setViewMode] = React.useState<"text" | "study">("text");

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
    setSegments([]);
    setViewMode("text");

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
          message: data
            ? pickErrorMessage(data, rawText || "No se pudo transcribir.")
            : rawText || "No se pudo transcribir.",
          variant: "danger",
        });
        return;
      }

      if (!data || !isObject(data) || data.ok !== true || !isObject(data.transcription)) {
        setPhase("error");
        push({
          title: "Error",
          message: "Respuesta inválida del servidor (no JSON).",
          variant: "danger",
        });
        return;
      }

      const t = data.transcription as Transcription;
      setResult(t);

      let segRaw: unknown = null;
if (isObject(data) && "segments" in data) {
  segRaw = (data as Record<string, unknown>).segments;
}
      if (Array.isArray(segRaw)) {
        const segs = segRaw.filter(isSegment) as WhisperSegment[];
        setSegments(segs);
        if (segs.length > 0) setViewMode("study"); // por defecto, modo estudio si hay segments
      }

      setProgress(100);
      setPhase("done");

      push({
        title: "Transcripción lista ✅",
        message: "Guardada en tu historial.",
        variant: "success",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

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
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Transcribir archivo</h1>
            <p className="mt-1 text-sm text-muted sm:mt-2">
              Sube un audio, elige idioma y genera una transcripción.
            </p>
          </div>
          <Badge>{result?.status ?? "—"}</Badge>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <label className="label" htmlFor="file">
              Archivo de audio
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="audio/*"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label="Seleccionar archivo de audio"
              disabled={isLoading}
            />
            <p className="hint">Formatos comunes: mp3, wav, m4a, ogg, webm. Máximo 25MB.</p>
          </div>

          <Select
            label="Idioma"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            options={[
              { value: "es", label: "Español" },
              { value: "en", label: "Inglés" },
              { value: "ca", label: "Catalán" },
              { value: "fr", label: "Francés" },
            ]}
          />

          <Input
            name="context"
            label="Contexto (opcional)"
            placeholder="Ej: reunión de trabajo sobre presupuesto..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isLoading}
            hint="Esto será útil al conectar un proveedor real."
          />

          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? "Transcribiendo..." : "Transcribir"}
          </Button>
        </form>
      </Card>

      {(isLoading || phase === "done" || phase === "error") && (
        <TranscriptionProgress
          phase={phase}
          progress={progress}
          isBusy={isLoading}
          onCancel={handleCancel}
        />
      )}

      {result?.transcript_text && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Resultado</h2>

            {/* ✅ Toggle simple */}
            {segments.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={viewMode === "study" ? "primary" : "ghost"}
                  onClick={() => setViewMode("study")}
                >
                  Modo estudio (tiempos)
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

          {viewMode === "text" || segments.length === 0 ? (
            <pre className="mt-2 whitespace-pre-wrap rounded-md border p-3 text-sm sm:p-4">
              {result.transcript_text}
            </pre>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-muted">
                Segmentos: {segments.length} • Pulsa y copia para estudiar por minuto/segundo.
              </div>
              <div className="max-h-[420px] overflow-auto rounded-md border p-3 text-sm">
                {segments.map((s) => (
                  <div key={s.id} className="py-2 border-b last:border-b-0">
                    <div className="text-xs text-muted">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </div>
                    <div className="whitespace-pre-wrap">{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
