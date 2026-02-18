"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AudioLines, Timer } from "lucide-react";
import type { Status } from "./hooks/useLiveTranscription";

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function statusLabel(s: Status) {
  if (s === "idle") return "Listo";
  if (s === "recording") return "Grabando";
  if (s === "paused") return "Pausado";
  if (s === "stopping") return "Finalizando";
  return "Hecho";
}

function statusBadgeVariant(s: Status): "default" | "accent" | "danger" | "outline" {
  if (s === "recording") return "accent";
  if (s === "paused") return "outline";
  if (s === "stopping") return "outline";
  if (s === "done") return "accent";
  return "default";
}

export function LiveHeader({ status, seconds }: { status: Status; seconds: number }) {
  const clock = formatClock(seconds);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border"
              style={{
                borderColor: "rgba(var(--accent),0.22)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--card),0.85))",
              }}
              aria-hidden="true"
            >
              <AudioLines size={18} />
            </span>

            <h1 className="text-xl font-semibold sm:text-2xl">Transcribir en vivo</h1>
          </div>

          <p className="mt-2 text-sm text-muted">
            Graba audio con el micrófono. Se envía por chunks y al finalizar se genera una transcripción.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>

          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
            style={{
              borderColor: "rgba(var(--accent),0.18)",
              background:
                "linear-gradient(135deg, rgba(var(--accent),0.08), rgba(var(--card),0.92))",
            }}
            aria-label={`Tiempo transcurrido ${clock}`}
            title="Tiempo"
          >
            <Timer size={14} aria-hidden="true" />
            <span className="font-medium text-fg">{clock}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
