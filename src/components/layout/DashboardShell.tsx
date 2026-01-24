import * as React from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Theme } from "@/lib/theme";

export function DashboardShell({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  return (
    <div className="min-h-screen">
      {/* Header móvil */}
      <header className="sticky top-0 z-20 border-b bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            JustWriteIt
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle initialTheme={initialTheme} />
            <Link
              href="/"
              className="text-sm text-muted hover:underline underline-offset-4"
            >
              Volver a landing
            </Link>
          </div>
        </div>
      </header>

      <div className="container-app grid gap-6 py-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar (persistente) */}
        <aside className="card p-4 md:sticky md:top-20 md:h-[calc(100vh-6rem)]">
          <p className="text-xs font-medium text-muted">NAVEGACIÓN</p>
          <div className="mt-3">
            <DashboardNav />
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-muted">
              Layout persistente: el menú no desaparece al cambiar de sección.
            </p>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
