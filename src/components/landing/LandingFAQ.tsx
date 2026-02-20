"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = { q: string; a: string };

const faqs: FAQItem[] = [
  {
    q: "¿Qué formatos de audio puedo subir?",
    a: "Puedes subir mp3, wav y m4a. También puedes transcribir grabando en vivo.",
  },
  {
    q: "¿Mis transcripciones se guardan?",
    a: "Sí. Se guardan en tu historial para que puedas volver, descargar o seguir estudiando cuando quieras.",
  },
  {
    q: "¿Qué es el modo estudio?",
    a: "Una vista pensada para aprender: repasar por segmentos, seguir el texto mientras escuchas y practicar idiomas con más precisión.",
  },
  {
    q: "¿Puedo usarlo en móvil?",
    a: "Sí. Está diseñado mobile-first y funciona muy bien en pantallas pequeñas.",
  },
];

function FAQRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mini-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium">{item.q}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 text-sm text-muted leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">Preguntas frecuentes</h2>
      <p className="mt-1 text-sm text-muted max-w-[80ch]">
        Respuestas rápidas para entender JustWriteIt en un minuto.
      </p>

      <div className="mt-4 grid gap-3">
        {faqs.map((item, idx) => (
          <FAQRow
            key={item.q}
            item={item}
            isOpen={open === idx}
            onToggle={() => setOpen(open === idx ? null : idx)}
          />
        ))}
      </div>
    </section>
  );
}