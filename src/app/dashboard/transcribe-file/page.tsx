"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { TranscriptionProgress } from "@/components/transcribe/TranscriptionProgress";
import { useUploadProgress } from "@/hooks/useUploadProgress";

type ApiOk = {
  ok: true;
  transcription: {
    id: string;
    status: string;
    language: string;
    audio_filename: string | null;
    duration: number | null;
    transcript_text: string | null;
    created_at: string;
  };
};

type ApiErr = { ok: false; error: string; details?: unknown };

export default function TranscribeFilePage() {
  const { push } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");
  const [result, setResult] = React.useState<ApiOk["transcription"] | null>(null);

  const uploader = useUploadProgress();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      push({ title: "Falta archivo", message: "Selecciona un audio para transcribir.", variant: "danger" });
      return;
    }

    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("language", language);
      fd.append("context", context);

      const { status, data } = await uploader.postForm<ApiOk | ApiErr>("/api/transcribe/file", fd);

      if (status < 200 || status >= 300 || !data || (data as ApiErr).ok === false) {
        uploader.fail();
        const msg = (data as ApiErr)?.error ?? "No se pudo transcribir.";
        push({ title: "Error", message: msg, variant: "danger" });
        return;
      }

      await uploader.finishOk();

      const okData = data as ApiOk;
      setResult(okData.transcription);
      push({ title: "Transcripción lista ✅", message: "Guardada en tu historial.", variant: "success" });
    } catch (err) {
      uploader.fail();
      push({
        title: "Error",
        message: err instanceof Error ? err.message : "Fallo inesperado.",
        variant: "danger",
      });
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transcribir archivo</h1>
          <p className="mt-2 text-sm text-muted">Sube un audio, elige idioma y genera una transcripción.</p>
        </div>
        <Badge>{result?.status ?? "—"}</Badge>
      </div>

      <div className="mt-6">
        <TranscriptionProgress
          phase={uploader.phase}
          progress={uploader.progress}
          isBusy={uploader.isBusy}
          onCancel={() => {
            uploader.cancel();
            push({ title: "Cancelado", message: "Se canceló la transcripción.", variant: "danger" });
          }}
        />
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <label className="label" htmlFor="file">Archivo de audio</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="audio/*"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            aria-label="Seleccionar archivo de audio"
            disabled={uploader.isBusy}
          />
          <p className="hint">Formatos comunes: mp3, wav, m4a, ogg, webm. Máximo 25MB.</p>
        </div>

        <Select
          label="Idioma"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "Inglés" },
            { value: "ca", label: "Catalán" },
            { value: "fr", label: "Francés" },
          ]}
          disabled={uploader.isBusy}
        />

        <Input
          name="context"
          label="Contexto (opcional)"
          placeholder="Ej: reunión de trabajo sobre presupuesto..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          hint="Esto ayudará al proveedor de transcripción (si se usa)."
          disabled={uploader.isBusy}
        />

        <Button type="submit" isLoading={uploader.isBusy} disabled={uploader.isBusy}>
          {uploader.isBusy ? "Procesando…" : "Transcribir"}
        </Button>
      </form>

      {result?.transcript_text ? (
        <div className="mt-6">
          <h2 className="text-sm font-medium">Resultado</h2>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border p-4 text-sm">
            {result.transcript_text}
          </pre>
        </div>
      ) : null}
    </Card>
  );
}
