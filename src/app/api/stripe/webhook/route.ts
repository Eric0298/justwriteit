import {
  getPlanFromStripePriceId,
  getStripeWebhookSecret,
  verifyStripeSignature,
  type StripeEvent,
} from "@/lib/billing/stripe";
import { normalizePlan, type PlanId } from "@/lib/billing/plans";
import {
  forgetStripeEvent,
  getUserIdByStripeCustomerId,
  markStripeEventProcessed,
  markStripeEventReceived,
  setUserPlan,
  upsertSubscription,
} from "@/lib/queries/billing";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" && value ? value : null;
}

function getMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  return isObject(obj.metadata) ? obj.metadata : {};
}

function getMetadataPlan(obj: Record<string, unknown>): PlanId | null {
  const plan = getString(getMetadata(obj), "plan");
  if (!plan) return null;
  const normalized = normalizePlan(plan);
  return normalized === "FREE" ? null : normalized;
}

function getMetadataUserId(obj: Record<string, unknown>): string | null {
  return getString(getMetadata(obj), "userId");
}

function getSubscriptionPricePlan(obj: Record<string, unknown>): PlanId | null {
  const items = isObject(obj.items) ? obj.items : null;
  const data = Array.isArray(items?.data) ? items.data : [];
  const firstItem = data.find(isObject);
  const price = firstItem && isObject(firstItem.price) ? firstItem.price : null;
  const priceId = price ? getString(price, "id") : null;
  return getPlanFromStripePriceId(priceId);
}

function getCurrentPeriodEnd(obj: Record<string, unknown>): Date | null {
  const raw = obj.current_period_end;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return new Date(raw * 1000);
}

function isActiveSubscriptionStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}

async function handleCheckoutCompleted(obj: Record<string, unknown>) {
  const userId = getString(obj, "client_reference_id") ?? getMetadataUserId(obj);
  const customer = getString(obj, "customer");
  const subscription = getString(obj, "subscription");
  const plan = getMetadataPlan(obj);

  if (!userId || !customer || !plan) return;

  await setUserPlan({ userId, plan, stripeCustomerId: customer });

  if (subscription) {
    await upsertSubscription({
      userId,
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      status: "active",
      plan,
      currentPeriodEnd: null,
    });
  }
}

async function handleSubscriptionEvent(obj: Record<string, unknown>) {
  const customer = getString(obj, "customer");
  const subscription = getString(obj, "id");
  const status = getString(obj, "status") ?? "unknown";
  const metadataPlan = getMetadataPlan(obj);
  const pricePlan = getSubscriptionPricePlan(obj);
  const plan = metadataPlan ?? pricePlan;

  if (!customer || !subscription || !plan) return;

  const userId = getMetadataUserId(obj) ?? (await getUserIdByStripeCustomerId(customer));
  if (!userId) return;

  await upsertSubscription({
    userId,
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription,
    status,
    plan,
    currentPeriodEnd: getCurrentPeriodEnd(obj),
  });

  await setUserPlan({
    userId,
    plan: isActiveSubscriptionStatus(status) ? plan : "FREE",
    stripeCustomerId: customer,
  });
}

async function handleEvent(event: StripeEvent) {
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(obj);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await handleSubscriptionEvent(obj);
  }
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");

  try {
    verifyStripeSignature({
      payload,
      signatureHeader,
      webhookSecret: getStripeWebhookSecret(),
    });
  } catch {
    return Response.json({ ok: false, error: "Webhook no valido." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
    if (!event.id || !event.type || !isObject(event.data?.object)) {
      throw new Error("Invalid event");
    }
  } catch {
    return Response.json({ ok: false, error: "Payload no valido." }, { status: 400 });
  }

  const shouldProcess = await markStripeEventReceived({
    eventId: event.id,
    eventType: event.type,
  });

  if (!shouldProcess) {
    return Response.json({ ok: true, received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
    await markStripeEventProcessed(event.id);
    return Response.json({ ok: true, received: true });
  } catch {
    await forgetStripeEvent(event.id);
    return Response.json({ ok: false, error: "No se pudo procesar el webhook." }, { status: 500 });
  }
}

