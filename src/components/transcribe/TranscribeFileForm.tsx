"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UsageNotice } from "@/components/billing/UsageNotice";
import type { UsageStatus } from "@/lib/types/usage";

type Props = {
  statusBadge: string;
  isLoading: boolean;
  usage: UsageStatus | null;

  file: File | null;
  setFile: (f: File | null) => void;

  language: string;
  setLanguage: (v: string) => void;

  context: string;
  setContext: (v: string) => void;

  onSubmit: (e: React.FormEvent) => void;
};

export function TranscribeFileForm({
  statusBadge,
  isLoading,
  usage,
  file,
  setFile,
  language,
  setLanguage,
  context,
  setContext,
  onSubmit,
}: Props) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Transcribir archivo</h1>
          <p className="mt-1 text-sm text-muted sm:mt-2">
            Sube un audio, elige idioma y genera una transcripción.
          </p>
        </div>
        <Badge>{statusBadge}</Badge>
      </div>

      <div className="mt-5">
        <UsageNotice usage={usage} />
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
        />

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !file || Boolean(usage && !usage.canTranscribe)}
        >
          {isLoading ? "Transcribiendo..." : "Transcribir"}
        </Button>
      </form>
    </Card>
  );
}
