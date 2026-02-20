import type { Metadata } from "next";
import LandingHero from "@/components/landing/LandingHero";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingScreenshots from "@/components/landing/LandingScreenshots";
import LandingSecurity from "@/components/landing/LandingSecurity";
import LandingUseCases from "@/components/landing/LandingUseCases";

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
    siteName,
    title,
    description,
    url: appUrl,
    images: [{ url: `${appUrl}/og.png`, width: 1200, height: 630, alt: "JustWriteIt" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
    <main className="container-app py-10 sm:py-14 space-y-8">
      <LandingHero />
      <LandingHowItWorks />
      <LandingScreenshots />
      <LandingUseCases />
      <LandingSecurity />
      <LandingFAQ />
      <LandingCTA />
    </main>
  );
}