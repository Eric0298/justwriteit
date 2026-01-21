import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, id, label, hint, error, children, ...props }, ref) => {
    const autoId = React.useId();
    const selectId = id ?? autoId;

    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-2">
        {label ? (
          <label className="label" htmlFor={selectId}>
            {label}
          </label>
        ) : null}

        <select
          ref={ref}
          id={selectId}
          className={cn(
            "input pr-10",
            "appearance-none",
            error && "border-danger/70 focus:border-danger",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {children}
        </select>

        {/* flecha visual (solo decorativa) */}
        <span
          className="pointer-events-none -mt-9 ml-auto mr-3 h-4 w-4 text-muted"
          aria-hidden="true"
        >
          ▼
        </span>

        {hint ? (
          <p id={hintId} className="hint">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
