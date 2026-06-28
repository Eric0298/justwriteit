import { auth } from "@/../auth";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { normalizePlan } from "@/lib/billing/plans";
import { getBillingProfile } from "@/lib/queries/billing";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

function readRequestedPlan(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const plan = (body as Record<string, unknown>).plan;
  return typeof plan === "string" ? normalizePlan(plan) : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `checkout:${session.user.id}:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiados intentos de checkout. Espera un momento." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const plan = readRequestedPlan(body);

  if (!plan || plan === "FREE") {
    return Response.json({ ok: false, error: "Plan no valido." }, { status: 400 });
  }

  const profile = await getBillingProfile(session.user.id);
  if (!profile) {
    return Response.json({ ok: false, error: "Usuario no encontrado." }, { status: 404 });
  }

  try {
    const checkout = await createCheckoutSession({
      userId: profile.id,
      email: profile.email,
      plan,
      stripeCustomerId: profile.stripe_customer_id,
    });

    return Response.json({ ok: true, url: checkout.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar el checkout.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

