import { GraduationCap, Briefcase, Users } from "lucide-react";

export default function LandingUseCases() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <GraduationCap size={16} aria-hidden="true" />
          Estudiantes
        </p>
        <p className="mt-2 text-sm text-muted">
          Convierte clases en texto y repasa por segmentos con modo estudio.
        </p>
      </div>

      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <Briefcase size={16} aria-hidden="true" />
          Profesionales
        </p>
        <p className="mt-2 text-sm text-muted">
          Reuniones, entrevistas, llamadas: transcribe y guarda todo ordenado.
        </p>
      </div>

      <div className="feature-card p-5">
        <p className="text-sm font-medium flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Creadores
        </p>
        <p className="mt-2 text-sm text-muted">
          Podcasts y vídeos: genera texto a partir del audio para reutilizar contenido.
        </p>
      </div>
    </section>
  );
}