"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X, AlertTriangle, Info } from "lucide-react";

type ToastVariant = "default" | "success" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function uid() {
  return Math.random().toString(16).slice(2);
}

function getToastIcon(variant: ToastVariant) {
  if (variant === "success") return CheckCircle2;
  if (variant === "danger") return AlertTriangle;
  return Info;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = uid();
    const item: ToastItem = {
      id,
      variant: "default",
      durationMs: 3500,
      ...toast,
    };

    setToasts((prev) => [item, ...prev]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, item.durationMs);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div
        className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const variant = t.variant ?? "default";
          const Icon = getToastIcon(variant);

          const borderColor =
            variant === "success"
              ? "rgba(var(--accent),0.45)"
              : variant === "danger"
              ? "rgba(var(--danger),0.50)"
              : "rgb(var(--border))";

          const accentBg =
            variant === "success"
              ? "linear-gradient(135deg, rgba(var(--accent),0.12), rgba(var(--accent-2),0.08))"
              : variant === "danger"
              ? "linear-gradient(135deg, rgba(var(--danger),0.10), rgba(0,0,0,0))"
              : "linear-gradient(135deg, rgba(var(--fg),0.03), rgba(0,0,0,0))";

          return (
            <div
              key={t.id}
              className={cn(
                "card border p-4 shadow-[var(--shadow-md)]",
                "backdrop-blur"
              )}
              style={{
                borderColor,
                background: `${accentBg}, rgba(var(--card), 0.82)`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border"
                  style={{
                    borderColor,
                    background:
                      variant === "success"
                        ? "rgba(var(--accent),0.12)"
                        : variant === "danger"
                        ? "rgba(var(--danger),0.10)"
                        : "rgba(var(--fg),0.03)",
                  }}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.message ? <p className="mt-1 text-sm text-muted">{t.message}</p> : null}
                </div>

                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => remove(t.id)}
                  aria-label="Cerrar notificación"
                >
                  <X size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  return ctx;
}
