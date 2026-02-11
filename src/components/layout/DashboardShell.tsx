"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import type { Theme } from "@/lib/theme";

export function DashboardShell({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-bg/95 backdrop-blur">
        <div className="container-app flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa móvil */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              ☰
            </Button>

            <Link href="/dashboard" className="font-semibold tracking-tight">
              JustWriteIt
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle initialTheme={initialTheme} />
            <Link
              href="/"
              className="text-sm text-muted hover:underline underline-offset-4"
            >
              Landing
            </Link>
          </div>
        </div>
      </header>

      <div className="container-app grid gap-6 py-6 md:grid-cols-[260px_1fr]">
        {/* ===== SIDEBAR DESKTOP ===== */}
        <aside className="hidden md:block card p-4 md:sticky md:top-20 md:h-[calc(100vh-6rem)]">
          <p className="text-xs font-medium text-muted">NAVEGACIÓN</p>
          <div className="mt-3">
            <DashboardNav />
          </div>
        </aside>

        {/* ===== SIDEBAR MÓVIL (DRAWER) ===== */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] p-6 md:hidden shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">NAVEGACIÓN</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <DashboardNav />
              </div>
            </aside>
          </>
        )}

        {/* ===== CONTENIDO ===== */}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
