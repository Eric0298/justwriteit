import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  Sparkles,
  Shield,
  GraduationCap,
  FileAudio,
  Mic,
  History,
} from "lucide-react";

export default function LandingHero() {
  return (
    <section className="hero-card p-6 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="min-w-0">
          <p className="hero-kicker">
            <Sparkles size={16} aria-hidden="true" />
            <span>Productividad · Transcripción · Estudio</span>
          </p>

          {/* Blindaje móvil: corte controlado */}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            De audio a texto,
            <span className="block sm:inline"> sin complicaciones.</span>
          </h1>

          <p className="mt-4 text-muted leading-relaxed max-w-[60ch]">
            Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras.
            <span className="block mt-2">
              <strong className="text-fg">Modo estudio:</strong> repasa por segmentos, repite y practica idiomas con precisión.
            </span>
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register">
              <Button>
                Crear cuenta <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="ghost">Ver dashboard</Button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{ borderColor: "rgba(var(--accent),0.18)" }}
            >
              <Shield size={14} aria-hidden="true" />
              Auth + DB + seguridad
            </span>

            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{ borderColor: "rgba(var(--accent),0.18)" }}
            >
              <GraduationCap size={14} aria-hidden="true" />
              Modo estudio (segmentos + loop)
            </span>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="grid gap-3">
          <div className="mini-card p-4">
            <p className="text-sm font-medium flex items-center gap-2">
              <FileAudio size={16} aria-hidden="true" />
              Transcribe archivo
            </p>
            <p className="mt-1 text-sm text-muted">
              Sube mp3/wav/m4a y obtén texto con segmentos.
            </p>
          </div>

          <div className="mini-card p-4">
            <p className="text-sm font-medium flex items-center gap-2">
              <Mic size={16} aria-hidden="true" />
              Transcribe en vivo
            </p>
            <p className="mt-1 text-sm text-muted">
              Grabación por chunks para sesiones largas.
            </p>
          </div>

          <div className="mini-card p-4">
            <p className="text-sm font-medium flex items-center gap-2">
              <History size={16} aria-hidden="true" />
              Historial
            </p>
            <p className="mt-1 text-sm text-muted">
              Encuentra, descarga y estudia con karaoke.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}