"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  const ref = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onClose = () => onOpenChange(false);
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onOpenChange]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "w-full max-w-lg rounded-[var(--radius-lg)] border bg-bg p-0 text-fg shadow-[var(--shadow-md)]"
      )}
      style={{ borderColor: "rgb(var(--border))" }}
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-desc" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description ? (
              <p id="modal-desc" className="mt-2 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            ✕
          </Button>
        </div>

        <div className="mt-5">{children}</div>

        <div className="mt-6 flex items-center justify-end gap-3">
          {footer ? (
            footer
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => onOpenChange(false)}>Aceptar</Button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
