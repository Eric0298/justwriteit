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

  const panelStyle: React.CSSProperties = {
    borderColor: "rgba(var(--accent),0.18)",
    background:
      "linear-gradient(135deg, rgba(var(--accent),0.08), rgba(var(--card),0.92))",
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="rounded-[var(--radius-lg)] border p-4 sm:p-5" style={panelStyle}>
        <p className="text-xs text-muted">Controles</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {/* IDLE: botón Grabar — primary con gradiente azul y texto oscuro */}
          {status === "idle" && (
            <Button variant="primary" onClick={onStart} aria-label="Iniciar grabación">
              <Mic size={16} aria-hidden="true" />
              <span>Grabar</span>
            </Button>
          )}

          {/* RECORDING */}
          {status === "recording" && (
            <>
              <Button variant="ghost" onClick={onPause} aria-label="Pausar grabación">
                <Pause size={16} aria-hidden="true" />
                <span>Pausar</span>
              </Button>
              <Button variant="danger" onClick={onStop} aria-label="Finalizar grabación">
                <Square size={16} aria-hidden="true" />
                <span>Finalizar</span>
              </Button>
            </>
          )}

          {/* PAUSED */}
          {status === "paused" && (
            <>
              <Button variant="primary" onClick={onResume} aria-label="Reanudar grabación">
                <Play size={16} aria-hidden="true" />
                <span>Reanudar</span>
              </Button>
              <Button variant="danger" onClick={onStop} aria-label="Finalizar grabación">
                <Square size={16} aria-hidden="true" />
                <span>Finalizar</span>
              </Button>
            </>
          )}

          {/* STOPPING */}
          {status === "stopping" && (
            <Button disabled aria-label="Finalizando">
              <Square size={16} aria-hidden="true" />
              <span>Finalizando...</span>
            </Button>
          )}

          {/* DONE */}
          {status === "done" && (
            <Button variant="ghost" onClick={onReset} aria-label="Nueva grabación">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Nueva grabación</span>
            </Button>
          )}

          {/* Reset disponible si no puede finalizar y no está en idle/done/stopping */}
          {!canFinish &&
            status !== "idle" &&
            status !== "done" &&
            status !== "stopping" && (
              <Button variant="ghost" onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
                <span>Reset</span>
              </Button>
            )}
        </div>

        <p className="mt-3 text-xs text-muted">
          Tip: durante la grabación puedes pausar y reanudar sin perder la sesión.
        </p>
      </div>
    </Card>
  );
}
//Hola