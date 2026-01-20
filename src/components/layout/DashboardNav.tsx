"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/transcribe-file", label: "Transcribir archivo" },
  { href: "/dashboard/transcribe-live", label: "Transcribir en vivo" },
  { href: "/dashboard/history", label: "Historial" },
  { href: "/dashboard/settings", label: "Ajustes" }
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-accent/10 text-fg"
                : "text-muted hover:bg-black/5 dark:hover:bg-white/10"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
