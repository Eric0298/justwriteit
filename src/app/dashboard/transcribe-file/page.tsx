// src/app/dashboard/transcribe-file/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

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

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function TranscribeFilePage() {
  const { push } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ApiOk["transcription"] | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      push({ title: "Falta archivo", message: "Selecciona un audio para transcribir.", variant: "danger" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 1) Subir a Vercel Blob via tu endpoint /api/upload
      const fd = new FormData();
      fd.append("file", file);

      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upRaw: unknown = await upRes.json().catch(() => null);

      if (!upRes.ok) {
        const msg =
          isObject(upRaw) && typeof upRaw.error === "string"
            ? upRaw.error
            : "No se pudo subir el archivo.";
        push({ title: "Error", message: msg, variant: "danger" });
        return;
      }

      if (!isObject(upRaw) || upRaw.ok !== true || typeof upRaw.url !== "string") {
        push({ title: "Error", message: "Respuesta inválida del servidor (upload).", variant: "danger" });
        return;
      }

      const uploadedUrl = upRaw.url;

      // 2) Llamar a /api/transcribe/file con JSON (NO mandamos el audio)
      const res = await fetch("/api/transcribe/file", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadedUrl,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          language,
          context,
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          isObject(data) && typeof data.error === "string"
            ? data.error
            : "No se pudo transcribir.";
        push({ title: "Error", message: msg, variant: "danger" });
        return;
      }

      if (!isObject(data) || data.ok !== true || !isObject(data.transcription)) {
        push({ title: "Error", message: "Respuesta inválida del servidor (no JSON válido).", variant: "danger" });
        return;
      }

      setResult(data.transcription as ApiOk["transcription"]);
      push({ title: "Transcripción lista ✅", message: "Guardada en tu historial.", variant: "success" });
    } catch (err) {
      push({
        title: "Error",
        message: err instanceof Error ? err.message : "Fallo inesperado.",
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transcribir archivo</h1>
          <p className="mt-2 text-sm text-muted">
            Sube un audio, elige idioma y genera una transcripción.
          </p>
        </div>
        <Badge>{result?.status ?? "—"}</Badge>
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
        />

        <Input
          name="context"
          label="Contexto (opcional)"
          placeholder="Ej: reunión de trabajo sobre presupuesto..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          hint="Esto será útil al conectar un proveedor real."
        />

        <Button type="submit" isLoading={isLoading}>
          {isLoading ? "Transcribiendo..." : "Transcribir"}
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
