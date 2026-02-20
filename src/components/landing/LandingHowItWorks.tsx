import { Upload, Wand2, Download } from "lucide-react";

export default function LandingHowItWorks() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <Upload size={16} aria-hidden="true" />
          1) Sube o graba
        </p>
        <p className="mt-2 text-sm text-muted">
          Archivos mp3/wav/m4a o grabación en vivo por sesiones.
        </p>
      </div>

      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <Wand2 size={16} aria-hidden="true" />
          2) Transcribe con IA
        </p>
        <p className="mt-2 text-sm text-muted">
          Segmentos claros para revisar, corregir y estudiar sin perderte.
        </p>
      </div>

      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <Download size={16} aria-hidden="true" />
          3) Guarda y exporta
        </p>
        <p className="mt-2 text-sm text-muted">
          Tu historial queda guardado. Descarga cuando lo necesites.
        </p>
      </div>
    </section>
  );
}