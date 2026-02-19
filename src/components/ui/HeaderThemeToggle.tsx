"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Theme } from "@/lib/theme";

export function HeaderThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  return <ThemeToggle initialTheme={initialTheme} />;
}