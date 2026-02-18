"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mic, Pause, Play, Square, RotateCcw } from "lucide-react";
import type { Status } from "./hooks/useLiveTranscription";

export function LiveControls(props: {
  status: Status;
  canFinish: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const { status, canFinish, onStart, onPause, onResume, onStop, onReset } = props;

  return (
    <Card className="p-4 sm:p-6">
      <div
        className="rounded-[var(--radius-lg)] border p-4 sm:p-5"
        style={{
          borderColor: "rgba(var(--accent),0.16)",
          background: "linear-gradient(135deg, rgba(var(--accent),0.07), rgba(var(--card),0.96))",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p className="text-xs text-muted">Controles</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {status === "idle" ? (
            <Button onClick={onStart} aria-label="Iniciar grabación">
              <Mic size={16} aria-hidden="true" />
              <span>Grabar</span>
            </Button>
          ) : null}

          {status === "recording" ? (
            <>
              <Button onClick={onPause} variant="ghost" aria-label="Pausar grabación">
                <Pause size={16} aria-hidden="true" />
                <span>Pausar</span>
              </Button>
              <Button onClick={onStop} variant="danger" aria-label="Finalizar grabación">
                <Square size={16} aria-hidden="true" />
                <span>Finalizar</span>
              </Button>
            </>
          ) : null}

          {status === "paused" ? (
            <>
              <Button onClick={onResume} aria-label="Reanudar grabación">
                <Play size={16} aria-hidden="true" />
                <span>Reanudar</span>
              </Button>
              <Button onClick={onStop} variant="danger" aria-label="Finalizar grabación">
                <Square size={16} aria-hidden="true" />
                <span>Finalizar</span>
              </Button>
            </>
          ) : null}

          {status === "stopping" ? (
            <Button disabled aria-label="Finalizando">
              <Square size={16} aria-hidden="true" />
              <span>Finalizando...</span>
            </Button>
          ) : null}

          {status === "done" ? (
            <Button onClick={onReset} variant="ghost" aria-label="Nueva grabación">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Nueva</span>
            </Button>
          ) : null}

          {!canFinish && status !== "idle" && status !== "done" && status !== "stopping" ? (
            <Button onClick={onReset} variant="ghost">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Reset</span>
            </Button>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-muted">
          Tip: durante la grabación puedes pausar y reanudar sin perder la sesión.
        </p>
      </div>
    </Card>
  );
}
