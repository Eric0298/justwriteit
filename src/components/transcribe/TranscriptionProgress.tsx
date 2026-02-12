"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export type Phase = "idle" | "uploading" | "transcribing" | "saving" | "done" | "error";

export function TranscriptionProgress({
  phase,
  progress,
  isBusy,
  onCancel,
}: {
  phase: Phase;
  progress: number; // 0..100
  isBusy: boolean;
  onCancel: () => void;
}) {
  const phaseLabel =
    phase === "idle" ? "—" :
    phase === "uploading" ? "Subiendo…" :
    phase === "transcribing" ? "Transcribiendo…" :
    phase === "saving" ? "Guardando…" :
    phase === "done" ? "Listo ✅" :
    "Error";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium">Estado:</span>{" "}
          <span className="text-muted">{phaseLabel}</span>
        </p>
        <p className="text-sm text-muted">{progress}%</p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full border"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${progress}%`,
            background: "rgb(var(--accent))",
          }}
        />
      </div>

      {isBusy ? (
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
