"use client";

import * as React from "react";

type Props = {
  password: string;
};

function scorePassword(pw: string) {
  let score = 0;
  const rules = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };

  if (rules.length) score += 1;
  if (rules.lower) score += 1;
  if (rules.upper) score += 1;
  if (rules.number) score += 1;

  if (rules.symbol) score += 1;
  if (pw.length >= 12) score += 1;

  const max = 6;
  const percent = Math.min(100, Math.round((score / max) * 100));

  let label = "Muy débil";
  if (percent >= 85) label = "Muy fuerte";
  else if (percent >= 65) label = "Fuerte";
  else if (percent >= 45) label = "Aceptable";
  else if (percent >= 25) label = "Débil";

  return { percent, label, rules };
}

export function PasswordStrength({ password }: Props) {
  const { percent, label, rules } = React.useMemo(() => scorePassword(password), [password]);

  return (
    <div className="grid gap-2" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Fuerza de contraseña</p>
        <p className="text-xs font-medium">{label}</p>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full border"
        style={{ borderColor: "rgb(var(--border))" }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fuerza de contraseña: ${label}`}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${percent}%`,
            background:
              percent >= 65
                ? "rgb(var(--accent))"
                : percent >= 35
                ? "rgba(99,102,241,0.55)"
                : "rgba(239,68,68,0.65)",
          }}
        />
      </div>

      <ul className="grid gap-1 text-xs text-muted">
        <li>{rules.length ? "✅" : "⬜"} 8+ caracteres</li>
        <li>{rules.lower ? "✅" : "⬜"} minúscula</li>
        <li>{rules.upper ? "✅" : "⬜"} mayúscula</li>
        <li>{rules.number ? "✅" : "⬜"} número</li>
      </ul>
    </div>
  );
}
