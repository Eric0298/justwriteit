import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "accent" | "danger" | "outline";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        "border border-transparent",
        variant === "default" &&
          "bg-black/5 text-fg dark:bg-white/10",
        variant === "accent" &&
          "bg-accent/15 text-fg border-[rgba(var(--accent),0.28)]",
        variant === "danger" &&
          "bg-danger/15 text-danger border-[rgba(var(--danger),0.28)]",
        variant === "outline" && "border bg-transparent text-fg",
        className
      )}
      style={variant === "outline" ? { borderColor: "rgb(var(--border))" } : undefined}
      {...props}
    />
  );
}
