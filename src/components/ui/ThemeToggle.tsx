"use client";

import * as React from "react";
import { setThemeAction } from "@/app/dashboard/actions";
import type { Theme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

type Props = {
  initialTheme: Theme;
};

function applyThemeToHtml(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle({ initialTheme }: Props) {
  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    applyThemeToHtml(theme);
  }, [theme]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyThemeToHtml(next);

    startTransition(() => {
      void setThemeAction(next);
    });
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "btn btn-ghost relative",
        "gap-2",
        "border border-transparent",
        "hover:border-[rgba(var(--accent),0.25)]"
      )}
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
      disabled={isPending}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span className="text-sm">{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

/** local cn (por si ThemeToggle se usa antes en imports circulares) */
function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}
