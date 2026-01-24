export type Theme = "light" | "dark";
export const THEME_COOKIE = "jwi_theme";

export function normalizeTheme(v: unknown): Theme | null {
  if (v === "light" || v === "dark") return v;
  return null;
}
