import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, hint, error, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-2">
        {label ? (
          <label className="label" htmlFor={inputId}>
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input",
            error && "border-[rgba(var(--danger),0.55)] focus:shadow-[var(--glow-danger)] focus:border-[rgba(var(--danger),0.75)]",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />

        {hint ? (
          <p id={hintId} className="hint">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} className="text-xs" style={{ color: "rgb(var(--danger))" }}>
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
