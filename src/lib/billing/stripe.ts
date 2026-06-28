import crypto from "node:crypto";
import { normalizePlan, type PlanId } from "@/lib/billing/plans";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeSession = {
  id: string;
  url: string;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no esta configurada.");
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET no esta configurado.");
  return secret;
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function getStripePriceId(plan: PlanId): string | null {
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO ?? null;
  if (plan === "PREMIUM") return process.env.STRIPE_PRICE_PREMIUM ?? null;
  return null;
}

export function getPlanFromStripePriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) {
    return "PRO";
  }
  if (
    process.env.STRIPE_PRICE_PREMIUM &&
    priceId === process.env.STRIPE_PRICE_PREMIUM
  ) {
    return "PREMIUM";
  }
  return null;
}

async function stripePost(
  path: string,
  params: URLSearchParams
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${getStripeSecretKey()}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const rawText = await res.text();
  let data: unknown = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
        ? data.error.message
        : "Stripe devolvio un error.";

    throw new Error(message);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Stripe devolvio una respuesta invalida.");
  }

  return data as Record<string, unknown>;
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  plan: PlanId;
  stripeCustomerId?: string | null;
}): Promise<StripeSession> {
  const plan = normalizePlan(input.plan);
  if (plan === "FREE") throw new Error("El plan gratuito no necesita checkout.");

  const priceId = getStripePriceId(plan);
  if (!priceId) throw new Error(`Falta configurar el precio de Stripe para ${plan}.`);

  const appUrl = getAppUrl();
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${appUrl}/dashboard/billing?checkout=success`);
  params.set("cancel_url", `${appUrl}/dashboard/billing?checkout=cancelled`);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("client_reference_id", input.userId);
  params.set("metadata[userId]", input.userId);
  params.set("metadata[plan]", plan);
  params.set("subscription_data[metadata][userId]", input.userId);
  params.set("subscription_data[metadata][plan]", plan);
  params.set("allow_promotion_codes", "true");

  if (input.stripeCustomerId) {
    params.set("customer", input.stripeCustomerId);
  } else {
    params.set("customer_email", input.email);
  }

  const data = await stripePost("/checkout/sessions", params);
  const url = typeof data.url === "string" ? data.url : null;
  const id = typeof data.id === "string" ? data.id : null;

  if (!url || !id) throw new Error("Stripe no devolvio URL de checkout.");
  return { id, url };
}

export async function createBillingPortalSession(input: {
  stripeCustomerId: string;
}): Promise<StripeSession> {
  const params = new URLSearchParams();
  params.set("customer", input.stripeCustomerId);
  params.set("return_url", `${getAppUrl()}/dashboard/billing`);

  const data = await stripePost("/billing_portal/sessions", params);
  const url = typeof data.url === "string" ? data.url : null;
  const id = typeof data.id === "string" ? data.id : null;

  if (!url || !id) throw new Error("Stripe no devolvio URL del portal.");
  return { id, url };
}

function parseStripeSignatureHeader(header: string): {
  timestamp: string | null;
  signatures: string[];
} {
  const parts = header.split(",");
  const signatures: string[] = [];
  let timestamp: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value ?? null;
    if (key === "v1" && value) signatures.push(value);
  }

  return { timestamp, signatures };
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyStripeSignature(input: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret: string;
  toleranceSeconds?: number;
}): void {
  if (!input.signatureHeader) throw new Error("Falta Stripe-Signature.");

  const { timestamp, signatures } = parseStripeSignatureHeader(input.signatureHeader);
  if (!timestamp || signatures.length === 0) {
    throw new Error("Firma de Stripe invalida.");
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) throw new Error("Timestamp de Stripe invalido.");

  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > toleranceSeconds) throw new Error("Firma de Stripe caducada.");

  const expected = crypto
    .createHmac("sha256", input.webhookSecret)
    .update(`${timestamp}.${input.payload}`, "utf8")
    .digest("hex");

  const ok = signatures.some((sig) => timingSafeHexEqual(sig, expected));
  if (!ok) throw new Error("Firma de Stripe no valida.");
}

