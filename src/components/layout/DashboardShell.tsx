"use client";

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
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <div className="container-app flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botón menú (solo móvil) */}
            <button
              type="button"
              className="btn btn-ghost md:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
            </button>

            <Link href="/dashboard" className="font-semibold tracking-tight">
              JustWriteIt
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle initialTheme={initialTheme} />
            <Link
              href="/"
              className="hidden text-sm text-muted hover:underline underline-offset-4 sm:inline"
            >
              Volver a landing
            </Link>
          </div>
        </div>
      </header>

      <div className="container-app grid gap-6 py-6 md:grid-cols-[260px_1fr]">
        <aside className="card hidden p-4 md:sticky md:top-20 md:block md:h-[calc(100vh-6rem)]">
          <p className="text-xs font-medium text-muted">NAVEGACIÓN</p>
          <div className="mt-3">
            <DashboardNav onNavigate={() => setOpen(false)} />
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-muted">
              Layout persistente: el menú no desaparece al cambiar de sección.
            </p>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />

          <aside className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-[320px] overflow-auto border-r bg-bg p-4 md:hidden">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">NAVEGACIÓN</p>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <DashboardNav onNavigate={() => setOpen(false)} />
            </div>

            <div className="mt-6 border-t pt-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:underline underline-offset-4"
              >
                Volver a landing
              </Link>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
