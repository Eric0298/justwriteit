"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onClose,
}: Props) {
  const ref = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const Icon = danger ? ShieldAlert : AlertTriangle;

  return (
    <dialog
      ref={ref}
      className="w-[min(520px,calc(100%-2rem))] rounded-[var(--radius-lg)] border bg-bg p-0 text-fg shadow-[var(--shadow-md)]"
      style={{ borderColor: "rgb(var(--border))" }}
      aria-labelledby="confirm-title"
      aria-describedby={description ? "confirm-desc" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border"
            style={{
              borderColor: danger ? "rgba(var(--danger),0.35)" : "rgba(var(--accent),0.30)",
              background: danger
                ? "rgba(var(--danger),0.10)"
                : "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--accent-2),0.10))",
            }}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>

          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description ? (
              <p id="confirm-desc" className="mt-2 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Cancelar">
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
