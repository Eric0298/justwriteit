import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FileAudio, Mic, History, Shield, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Landing",
  description:
    "Transcribe archivos o voz en vivo y guarda todo en tu historial. JustWriteIt: rápido, simple y listo para crecer.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "JustWriteIt",
    description:
      "Transcribe archivos o voz en vivo y guarda todo en tu historial. Rápido, simple y listo para crecer.",
    url: "/",
  },
  twitter: {
    title: "JustWriteIt",
    description:
      "Transcribe archivos o voz en vivo y guarda todo en tu historial. Rápido, simple y listo para crecer.",
  },
};

export default function LandingPage() {
  return (
    <main className="container-app py-10 sm:py-14">
      {/* HERO */}
      <section className="hero-card p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="min-w-0">
            <p className="hero-kicker">
              <Sparkles size={16} aria-hidden="true" />
              <span>Productividad · Transcripción · Estudio</span>
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Transcribe y escribe sin fricción.
            </h1>

            <p className="mt-4 text-muted leading-relaxed">
              Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras.
              Base profesional lista para crecer (auth, DB, seguridad y deploy).
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
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                    style={{ borderColor: "rgba(var(--accent),0.18)" }}>
                <Shield size={14} aria-hidden="true" />
                Auth + DB + seguridad
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                    style={{ borderColor: "rgba(var(--accent),0.18)" }}>
                <Sparkles size={14} aria-hidden="true" />
                UI hielo (claro/oscuro)
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

      {/* FEATURES */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="feature-card p-5">
          <p className="text-sm font-medium">Diseño calmado</p>
          <p className="mt-2 text-sm text-muted">
            Fondos hielo y color solo en detalles, bordes, badges y acciones.
          </p>
        </div>

        <div className="feature-card p-5">
          <p className="text-sm font-medium">100% responsive</p>
          <p className="mt-2 text-sm text-muted">
            Pensado para móvil desde el principio.
          </p>
        </div>

        <div className="feature-card p-5">
          <p className="text-sm font-medium">Listo para branding</p>
          <p className="mt-2 text-sm text-muted">
            Después añadimos logo, favicon e imágenes sin rehacer la base.
          </p>
        </div>
      </section>
    </main>
  );
}
