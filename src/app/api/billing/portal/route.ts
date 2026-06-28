import { auth } from "@/../auth";
import { createBillingPortalSession } from "@/lib/billing/stripe";
import { getBillingProfile } from "@/lib/queries/billing";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const ip = await getClientIp();
  const limited = await rateLimit({
    key: `billing-portal:${session.user.id}:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Demasiados intentos. Espera un momento." },
      { status: 429 }
    );
  }

  const profile = await getBillingProfile(session.user.id);
  if (!profile?.stripe_customer_id) {
    return Response.json(
      { ok: false, error: "Todavia no hay cliente de Stripe para esta cuenta." },
      { status: 400 }
    );
  }

  try {
    const portal = await createBillingPortalSession({
      stripeCustomerId: profile.stripe_customer_id,
    });

    return Response.json({ ok: true, url: portal.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo abrir el portal de cliente.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

