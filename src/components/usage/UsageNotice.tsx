"use client";

import { Badge } from "@/components/ui/Badge";
import type { UsageStatus } from "@/lib/types/usage";
import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";

export function UsageNotice({ usage }: { usage: UsageStatus | null }) {
  if (!usage) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border px-3 py-2 text-sm text-muted"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        Cargando limite diario...
      </div>
    );
  }

  const isEmpty = usage.remainingToday <= 0;
  const isLow = usage.remainingToday === 1;
  const Icon = isEmpty || isLow ? AlertTriangle : Gauge;

  return (
    <div
      className="rounded-[var(--radius-lg)] border p-3"
      style={{
        borderColor: isEmpty
          ? "rgba(var(--danger),0.45)"
          : "rgba(var(--accent),0.22)",
        background: isEmpty
          ? "linear-gradient(135deg, rgba(var(--danger),0.08), rgba(var(--card),0.90))"
          : "linear-gradient(135deg, rgba(var(--accent),0.08), rgba(var(--card),0.90))",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border"
            style={{
              borderColor: isEmpty
                ? "rgba(var(--danger),0.35)"
                : "rgba(var(--accent),0.28)",
              background: "rgba(var(--card),0.72)",
            }}
            aria-hidden="true"
          >
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{usage.message}</p>
            <p className="mt-1 text-xs text-muted">
              Maximo por audio: {usage.maxAudioFileSizeMb}MB.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={isEmpty ? "danger" : "accent"}>
            {usage.remainingToday}/{usage.dailyLimit} hoy
          </Badge>
          {!isEmpty ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
        </div>
      </div>
    </div>
  );
}
