"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function LiveResult({ text }: { text: string }) {
  if (!text) return null;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Resultado</h2>
        <Badge variant="accent">Transcrito</Badge>
      </div>

      <pre
        className="mt-3 whitespace-pre-wrap rounded-[var(--radius-lg)] border p-4 text-sm"
        style={{
          borderColor: "rgba(var(--accent),0.16)",
          background: "linear-gradient(180deg, rgba(var(--card),0.94), rgba(var(--card),0.98))",
        }}
      >
        {text}
      </pre>
    </Card>
  );
}
