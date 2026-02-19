"use client";

import * as React from "react";
import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/dashboard/actions";

type Props = {
  name: string;
  email: string;
};

export function UserMenu({ name, email }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Menú de ${name}`}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #38bdf8, #6366f1)",
          border: "2px solid rgba(56,189,248,0.55)",
          boxShadow: "0 0 0 3px rgba(56,189,248,0.18), 0 4px 12px rgba(56,189,248,0.35)",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "700",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          transition: "box-shadow 0.2s, transform 0.15s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 4px rgba(56,189,248,0.30), 0 6px 18px rgba(56,189,248,0.45)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.07)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 3px rgba(56,189,248,0.18), 0 4px 12px rgba(56,189,248,0.35)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[var(--radius-lg)] border p-1"
          style={{
            background: "rgb(var(--card))",
            borderColor: "rgba(var(--accent),0.25)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Info usuario */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 mb-1 border-b"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            {/* Mini avatar en el dropdown */}
            <span
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                color: "#ffffff", fontSize: "11px", fontWeight: "700",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "rgb(var(--fg))" }}>{name}</p>
              <p className="text-xs truncate" style={{ color: "rgb(var(--muted))" }}>{email}</p>
            </div>
          </div>

          {/* Cerrar sesión */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition"
              style={{ color: "rgb(var(--danger))" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
              }
            >
              <LogOut size={14} aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}