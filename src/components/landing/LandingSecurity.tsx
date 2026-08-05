import { ShieldCheck, Lock, Database } from "lucide-react";

export default function LandingSecurity() {
  return (
    <section
      className="rounded-[var(--radius-lg)] border p-6"
      style={{ borderColor: "rgba(var(--accent),0.12)" }}
    >
      <h2 className="text-xl font-semibold tracking-tight">Privacidad y control</h2>
      <p className="mt-2 text-sm text-muted max-w-[80ch]">
        Cuentas, historial y acceso protegido para que puedas gestionar tus transcripciones desde un mismo lugar.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="mini-card p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck size={16} aria-hidden="true" />
            Auth + permisos
          </p>
          <p className="mt-1 text-sm text-muted">
            Tus transcripciones son privadas por defecto.
          </p>
        </div>

        <div className="mini-card p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <Lock size={16} aria-hidden="true" />
            Seguridad
          </p>
          <p className="mt-1 text-sm text-muted">
            Validación, rate limit y protección de endpoints.
          </p>
        </div>

        <div className="mini-card p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <Database size={16} aria-hidden="true" />
            Historial
          </p>
          <p className="mt-1 text-sm text-muted">
            Guarda, busca y recupera tus sesiones cuando quieras.
          </p>
        </div>
      </div>
    </section>
  );
}