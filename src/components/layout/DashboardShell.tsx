"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import type { Theme } from "@/lib/theme";
import { Menu, X, ExternalLink } from "lucide-react";

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
      <div className="container-app grid gap-6 py-6 md:grid-cols-[280px_1fr]">
        {/* ===== SIDEBAR DESKTOP ===== */}
        <aside className="hidden md:block sidebar-card md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="brand">
              <span className="brand-dot" aria-hidden="true" />
              <span className="font-semibold tracking-tight">JustWriteIt</span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle initialTheme={initialTheme} />
              <Link href="/" className="btn btn-ghost text-sm" aria-label="Ir a la landing">
                <ExternalLink size={16} aria-hidden="true" />
                <span>Landing</span>
              </Link>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold tracking-wide text-muted">NAVEGACIÓN</p>
            <div className="mt-3">
              <DashboardNav />
            </div>
          </div>

          <div className="mt-4 border-t pt-4" style={{ borderColor: "rgb(var(--border))" }}>
            <p className="text-xs text-muted">
              Consejo: usa “Historial” para volver a tus transcripciones.
            </p>
          </div>
        </aside>

        {/* ===== BOTÓN MENÚ MÓVIL ===== */}
        <div className="md:hidden flex items-center justify-between">
          <Link href="/dashboard" className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="font-semibold tracking-tight">JustWriteIt</span>
          </Link>

          <Button
            variant="ghost"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={18} aria-hidden="true" />
          </Button>
        </div>

        {/* ===== SIDEBAR MÓVIL (DRAWER) ===== */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 backdrop" onClick={() => setMobileOpen(false)} />

            <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] drawer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="brand-dot" aria-hidden="true" />
                  <p className="text-sm font-semibold">JustWriteIt</p>
                </div>

                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <ThemeToggle initialTheme={initialTheme} />
                <Link href="/" className="btn btn-ghost text-sm" aria-label="Ir a la landing">
                  <ExternalLink size={16} aria-hidden="true" />
                  <span>Landing</span>
                </Link>
              </div>

              <p className="mt-6 text-xs font-semibold tracking-wide text-muted">NAVEGACIÓN</p>

              <div className="mt-3">
                <DashboardNav onNavigate={() => setMobileOpen(false)} />
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
