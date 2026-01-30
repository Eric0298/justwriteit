// src/components/ui/Select.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
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

        <select
          id={selectId}
          ref={ref}
          className={cn("input", className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

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
