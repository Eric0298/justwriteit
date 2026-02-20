import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  FileAudio,
  Mic,
  History,
  Shield,
  Sparkles,
  ArrowRight,
  GraduationCap,
  TabletSmartphone,
  Cog,
} from "lucide-react";

const siteName = "JustWriteIt";
const appUrl = "https://www.justwriteit.app";

const title = "JustWriteIt — Transcribe audio a texto con IA";
const description =
  "De audio a texto, sin complicaciones. Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras. Activa el modo estudio para practicar idiomas con precisión.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },

  openGraph: {
  type: "website",
  locale: "es_ES",
  siteName: "JustWriteIt",
  title: "JustWriteIt — Transcribe audio a texto con IA",
  description:
    "De audio a texto, sin complicaciones. Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras. Activa el modo estudio para practicar idiomas con precisión.",
  url: appUrl,
  images: [
    {
      url: `${appUrl}/og.png`,
      width: 1200,
      height: 630,
      alt: "JustWriteIt",
    },
  ],
},

  twitter: {
  card: "summary_large_image",
  title: "JustWriteIt — Transcribe audio a texto con IA",
  description:
    "De audio a texto, sin complicaciones. Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras. Activa el modo estudio para practicar idiomas con precisión.",
  images: [`${appUrl}/og.png`],
},

  keywords: [
    "transcribir audio a texto",
    "transcripción automática",
    "transcripción online",
    "convertir audio a texto",
    "transcripción en español",
    "transcribir mp3",
    "transcribir voz",
    "speech to text español",
  ],
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
              De audio a texto, sin complicaciones.
            </h1>

            <p className="mt-4 text-muted leading-relaxed">
              Sube un audio o graba en vivo. Guarda todo en tu historial y vuelve cuando quieras.
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
          <p className="text-sm font-medium">
            <GraduationCap size={16} aria-hidden="true" />
            Enfocados en &ldquo;modo estudio&rdquo;
          </p>
          <p className="mt-2 text-sm text-muted">
            Aprende del audio: localiza, lee y repasa por partes.
          </p>
        </div>

        <div className="feature-card p-5">
          <p className="text-sm font-medium">
            <TabletSmartphone size={16} aria-hidden="true" />
            100% responsive
          </p>
          <p className="mt-2 text-sm text-muted">
            Pensado para móvil desde el principio.
          </p>
        </div>

        <div className="feature-card p-5">
          <p className="text-sm font-medium">
            <Cog size={16} aria-hidden="true" />
            Próximamente
          </p>
          <p className="mt-2 text-sm text-muted">
            Traduce tus transcripciones sin salir de JustWriteIt.
          </p>
        </div>
      </section>

      {/* SEO TEXT BLOCK */}
      <section
        className="mt-10 rounded-[var(--radius-lg)] border p-6 text-sm text-muted leading-relaxed"
        style={{ borderColor: "rgba(var(--accent),0.12)" }}
      >
        <h2 className="text-base font-semibold text-fg mb-3">¿Qué es JustWriteIt?</h2>
        <p>
          JustWriteIt es una herramienta online para <strong>transcribir audio a texto</strong> de forma
          automática usando inteligencia artificial. Puedes subir archivos de audio en formatos como
          mp3, wav o m4a, o grabar directamente desde el micrófono para obtener una transcripción
          en tiempo real.
        </p>
        <p className="mt-3">
          Ideal para estudiantes que quieren repasar clases, profesionales que necesitan transcribir
          reuniones, o cualquier persona que trabaje con audio en español u otros idiomas.
          Todas tus transcripciones quedan guardadas en tu historial personal para que puedas
          acceder a ellas cuando quieras.
        </p>
      </section>
    </main>
  );
}