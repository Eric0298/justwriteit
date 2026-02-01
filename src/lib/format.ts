export function formatDateTime(iso: string, locale = "es-ES") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function clampText(text: string, max = 140) {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}
