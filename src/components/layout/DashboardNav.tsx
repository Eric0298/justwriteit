"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  Home,
  FileAudio,
  Mic,
  History,
  Settings,
  ChevronRight,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/transcribe-file", label: "Transcribir archivo", icon: FileAudio },
  { href: "/dashboard/transcribe-live", label: "Transcribir en vivo", icon: Mic },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
] as const;

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition",
              "outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
              active
                ? "nav-item-active"
                : "nav-item"
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-[12px] border transition",
                  active ? "nav-icon-active" : "nav-icon"
                )}
              >
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="truncate">{item.label}</span>
            </span>

            <ChevronRight
              size={16}
              className={cn(
                "opacity-0 transition group-hover:opacity-70",
                active && "opacity-70"
              )}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}
