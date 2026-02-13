"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
};

export function HistoryListActions({ id }: Props) {
  const { push } = useToast();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

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
        title: "Borrado",
        message: "La transcripción se eliminó.",
        variant: "success",
      });

      router.refresh();
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <React.Fragment>
      <div className="flex items-center gap-2">
        {/* AQUÍ ESTABA EL ERROR: Añadida la etiqueta <a> */}
        <a
          href={`/api/transcriptions/${id}/download`}
          className="btn btn-ghost btn-sm"
          aria-label="Descargar"
        >
          Descargar
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
        >
          Borrar
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Borrar transcripción"
        description="Esta acción no se puede deshacer."
        confirmText={busy ? "Borrando..." : "Borrar"}
        cancelText="Cancelar"
        danger
        onConfirm={remove}
        onClose={() => (busy ? null : setConfirmOpen(false))}
      />
    </React.Fragment>
  );}