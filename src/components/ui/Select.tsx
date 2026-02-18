"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, options, ...props }, ref) => {
    const autoId = React.useId();
    const selectId = id ?? autoId;

    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-2">
        {label ? (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        ) : null}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "input pr-10 appearance-none",
              error
                ? "border-[rgba(var(--danger),0.55)] focus:shadow-[var(--glow-danger)] focus:border-[rgba(var(--danger),0.75)]"
                : "",
              className
            )}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
            aria-hidden="true"
          />
        </div>

        {error ? (
          <p id={errorId} className="text-xs" style={{ color: "rgb(var(--danger))" }}>
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="hint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
