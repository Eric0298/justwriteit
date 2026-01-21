"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

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

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      {/* Región accesible para lectores de pantalla */}
      <div
        className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "card border p-4 shadow-[var(--shadow-md)]",
              t.variant === "success" && "border-accent/40",
              t.variant === "danger" && "border-danger/50"
            )}
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                {t.message ? (
                  <p className="mt-1 text-sm text-muted">{t.message}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => remove(t.id)}
                aria-label="Cerrar notificación"
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return ctx;
}
