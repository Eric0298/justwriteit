"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CreditCard, ExternalLink } from "lucide-react";

type Props =
  | {
      mode: "checkout";
      plan: "PRO" | "PREMIUM";
      children: React.ReactNode;
      disabled?: boolean;
    }
  | {
      mode: "portal";
      children: React.ReactNode;
      disabled?: boolean;
    };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function BillingActionButton(props: Props) {
  const { push } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleClick() {
    setIsLoading(true);

    try {
      const res = await fetch(
        props.mode === "checkout" ? "/api/billing/checkout" : "/api/billing/portal",
        {
          method: "POST",
          headers: props.mode === "checkout" ? { "content-type": "application/json" } : undefined,
          body: props.mode === "checkout" ? JSON.stringify({ plan: props.plan }) : undefined,
        }
      );

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !isObject(data) || typeof data.url !== "string") {
        const message =
          isObject(data) && typeof data.error === "string"
            ? data.error
            : "No se pudo abrir Stripe.";
        push({ title: "Error de pago", message, variant: "danger" });
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      push({
        title: "Error de pago",
        message: error instanceof Error ? error.message : "Fallo inesperado.",
        variant: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const Icon = props.mode === "checkout" ? CreditCard : ExternalLink;

  return (
    <Button
      type="button"
      variant={props.mode === "checkout" ? "primary" : "ghost"}
      onClick={handleClick}
      isLoading={isLoading}
      disabled={props.disabled}
      className="w-full"
    >
      <Icon size={16} aria-hidden="true" />
      <span>{props.children}</span>
    </Button>
  );
}

