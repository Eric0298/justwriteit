"use client";

import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export function LiveSettings(props: {
  language: string;
  setLanguage: (v: string) => void;
  context: string;
  setContext: (v: string) => void;
  disabled: boolean;
}) {
  const { language, setLanguage, context, setContext, disabled } = props;

  return (
    <Card className="p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Idioma"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "Inglés" },
            { value: "ca", label: "Catalán" },
            { value: "fr", label: "Francés" },
          ]}
          disabled={disabled}
        />

        <Input
          name="context"
          label="Contexto (opcional)"
          placeholder="Ej: entrevista / reunión / clase..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={disabled}
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        Puedes ajustar idioma/contexto solo antes de empezar (estado: idle).
      </p>
    </Card>
  );
}
