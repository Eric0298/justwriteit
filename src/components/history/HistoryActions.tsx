"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Copy, Download, Trash2, Subtitles } from "lucide-react";

type Props = {
  id: string;
  transcriptText: string;
};

export function HistoryActions({ id, transcriptText }: Props) {
  const { push } = useToast();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(transcriptText ?? "");
      push({
        title: "Copiado ✅",
        message: "Texto copiado al portapapeles.",
        variant: "success",
      });
    } catch {
      push({
        title: "No se pudo copiar",
        message: "Tu navegador bloqueó el portapapeles.",
        variant: "danger",
      });
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/transcriptions/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        push({
          title: "Error",
          message: data?.error ?? "No se pudo borrar.",
          variant: "danger",
        });
        return;
      }

      push({
        title: "Borrado ✅",
        message: "La transcripción se eliminó.",
        variant: "success",
      });

      router.push("/dashboard/history");
      router.refresh();
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={copy} aria-label="Copiar transcripción">
          <Copy size={16} aria-hidden="true" />
          Copiar
        </Button>

        <a
          href={`/api/transcriptions/${id}/download`}
          className="btn btn-ghost"
          aria-label="Descargar transcripción en TXT"
        >
          <Download size={16} aria-hidden="true" />
          Descargar .txt
        </a>

        <a
          href={`/api/transcriptions/${id}/download/vtt`}
          className="btn btn-ghost"
          aria-label="Descargar subtítulos VTT"
        >
          <Subtitles size={16} aria-hidden="true" />
          Descargar .vtt
        </a>

        <a
          href={`/api/transcriptions/${id}/download/srt`}
          className="btn btn-ghost"
          aria-label="Descargar subtítulos SRT"
        >
          <Subtitles size={16} aria-hidden="true" />
          Descargar .srt
        </a>

        <Button
          type="button"
          variant="danger"
          onClick={() => setConfirmOpen(true)}
          aria-label="Borrar transcripción"
          disabled={busy}
        >
          <Trash2 size={16} aria-hidden="true" />
          Borrar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Borrar transcripción?"
        description="Esta acción no se puede deshacer. Se eliminará solo de tu cuenta."
        confirmText={busy ? "Borrando..." : "Sí, borrar"}
        cancelText="Cancelar"
        danger
        onConfirm={remove}
        onClose={() => (busy ? null : setConfirmOpen(false))}
      />
    </>
  );
}
