export default function LandingScreenshots() {
  const shots = [
    { src: "/landing/dashboard-light.png", alt: "Dashboard en modo claro" },
    { src: "/landing/dashboard-dark.png", alt: "Dashboard en modo oscuro" },
    { src: "/landing/history-light.png", alt: "Historial de transcripciones" },
    { src: "/landing/study-dark.png", alt: "Modo estudio / karaoke" },
  ];

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Así se ve por dentro</h2>
          <p className="mt-1 text-sm text-muted max-w-[80ch]">
            Interfaz “UI hielo” en claro/oscuro, pensada para trabajar rápido: transcribir,
            revisar y volver al historial cuando quieras.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {shots.map((s) => (
          <figure key={s.src} className="mini-card p-3 overflow-hidden">
            <img
              src={s.src}
              alt={s.alt}
              className="block w-full max-w-full h-auto rounded-[var(--radius-md)] border"
              style={{ borderColor: "rgba(var(--border),0.7)" }}
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-muted">{s.alt}</figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Tip: si alguna captura se ve muy “alta”, recórtala a un formato similar antes de subirla.
      </p>
    </section>
  );
}