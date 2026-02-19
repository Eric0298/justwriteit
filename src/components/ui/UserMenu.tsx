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

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Iniciales del nombre
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
        className="flex items-center gap-2 rounded-full border px-2 py-1 text-sm transition hover:bg-[rgba(var(--fg),0.06)]"
        style={{ borderColor: "rgba(var(--accent),0.25)" }}
      >
        {/* Avatar con iniciales */}
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, rgb(var(--accent)), rgba(var(--accent-2),0.85))",
            color: "rgb(3 7 18)",
          }}
        >
          {initials}
        </span>
        <span className="hidden sm:block font-medium">{name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-[var(--radius-lg)] border p-1 shadow-[var(--shadow-md)]"
          style={{
            background: "rgb(var(--card))",
            borderColor: "rgb(var(--border))",
          }}
        >
          {/* Info usuario */}
          <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "rgb(var(--border))" }}>
            <p className="text-xs font-semibold truncate">{name}</p>
            <p className="text-xs text-muted truncate">{email}</p>
          </div>

          {/* Cerrar sesión */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition hover:bg-[rgba(var(--danger),0.08)] text-danger"
              style={{ color: "rgb(var(--danger))" }}
            >
              <LogOut size={15} aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}