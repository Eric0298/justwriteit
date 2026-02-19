"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/ui/UserMenu";
import type { Theme } from "@/lib/theme";
import { Menu, X, ExternalLink } from "lucide-react";

export function DashboardShell({
  children,
  initialTheme,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
  userName: string;
  userEmail: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Ocultar el header global en móvil dentro del dashboard (evita duplicación)
  React.useEffect(() => {
    const header = document.getElementById("global-header");
    if (!header) return;
    function update() {
      if (!header) return;
      header.style.display = window.innerWidth < 768 ? "none" : "";
    }
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (header) header.style.display = "";
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container-app grid gap-6 py-6 md:grid-cols-[280px_1fr]">

        {/* ===== SIDEBAR DESKTOP — solo navegación ===== */}
        <aside className="hidden md:block sidebar-card md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
          <div className="mt-1">
            <p className="text-xs font-semibold tracking-wide text-muted">NAVEGACIÓN</p>
            <div className="mt-3">
              <DashboardNav />
            </div>
          </div>
        </aside>

        {/* ===== HEADER MÓVIL ===== */}
        <div className="md:hidden flex items-center justify-between">
          <Link href="/dashboard" className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="font-semibold tracking-tight">JustWriteIt</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle initialTheme={initialTheme} />
            <Button
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* ===== DRAWER MÓVIL ===== */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 backdrop" onClick={() => setMobileOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] drawer flex flex-col">

              {/* Cabecera del drawer */}
              <div className="flex items-center justify-between">
                <Link href="/" className="btn btn-ghost text-sm" aria-label="Ir a la landing">
                  <ExternalLink size={16} aria-hidden="true" />
                  <span>Landing</span>
                </Link>
                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>

              {/* Navegación */}
              <p className="mt-6 text-xs font-semibold tracking-wide text-muted">NAVEGACIÓN</p>
              <div className="mt-3 flex-1">
                <DashboardNav onNavigate={() => setMobileOpen(false)} />
              </div>

              {/* Usuario en la parte inferior del drawer */}
              <div
                className="mt-6 pt-4 border-t flex items-center gap-3"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                <UserMenu name={userName} email={userEmail} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "rgb(var(--fg))" }}>
                    {userName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgb(var(--muted))" }}>
                    {userEmail}
                  </p>
                </div>
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