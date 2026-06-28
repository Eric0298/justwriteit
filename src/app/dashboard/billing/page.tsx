import { auth } from "@/../auth";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BillingActionButton } from "@/components/billing/BillingActionButton";
import {
  PLAN_LIMITS,
  isPaidPlan,
  normalizePlan,
  type PlanId,
} from "@/lib/billing/plans";
import { getBillingProfile, getUsageStatus } from "@/lib/queries/billing";
import { CheckCircle2, Crown, Gauge, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

function planTone(plan: PlanId) {
  if (plan === "FREE") return Gauge;
  if (plan === "PRO") return ShieldCheck;
  return Crown;
}

function checkoutMessage(status: string | undefined) {
  if (status === "success") return "Pago confirmado por Stripe. El plan se activara cuando llegue el webhook valido.";
  if (status === "cancelled") return "Checkout cancelado. Tu plan no ha cambiado.";
  return null;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, usage, sp] = await Promise.all([
    getBillingProfile(session.user.id),
    getUsageStatus(session.user.id),
    searchParams,
  ]);

  if (!profile) redirect("/login");

  const currentPlan = normalizePlan(profile.plan);
  const message = checkoutMessage(sp.checkout);
  const hasPaidSubscription =
    isPaidPlan(currentPlan) && Boolean(profile.stripe_customer_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Plan y pagos</h1>
            <p className="mt-2 text-sm text-muted">
              Gestiona el acceso freemium de JustWriteIt y tus limites diarios de transcripcion.
            </p>
          </div>
          <Badge variant="accent">Plan actual: {PLAN_LIMITS[currentPlan].label}</Badge>
        </div>

        <div
          className="mt-5 rounded-[var(--radius-lg)] border p-3 text-sm"
          style={{
            borderColor: "rgba(var(--accent),0.18)",
            background: "linear-gradient(135deg, rgba(var(--accent),0.08), rgba(var(--card),0.92))",
          }}
        >
          <p className="font-medium">{usage.message}</p>
          <p className="mt-1 text-xs text-muted">
            Usadas hoy: {usage.usedToday}/{usage.dailyLimit}. Maximo por audio:{" "}
            {usage.maxAudioFileSizeMb}MB.
          </p>
        </div>

        {message ? (
          <div
            className="mt-4 rounded-[var(--radius-lg)] border p-3 text-sm"
            style={{
              borderColor:
                sp.checkout === "success"
                  ? "rgba(var(--accent),0.35)"
                  : "rgba(var(--danger),0.35)",
            }}
            role="status"
          >
            {message}
          </div>
        ) : null}

        {profile.stripe_customer_id ? (
          <div className="mt-5 max-w-xs">
            <BillingActionButton mode="portal">Gestionar suscripcion</BillingActionButton>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLAN_LIMITS) as PlanId[]).map((plan) => {
          const limits = PLAN_LIMITS[plan];
          const Icon = planTone(plan);
          const isCurrent = currentPlan === plan;

          return (
            <Card key={plan} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-[14px] border"
                      style={{
                        borderColor: "rgba(var(--accent),0.22)",
                        background:
                          "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--card),0.86))",
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={17} />
                    </span>
                    <h2 className="text-lg font-semibold">{limits.label}</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {limits.dailyTranscriptionLimit} transcripciones al dia.
                  </p>
                </div>
                {isCurrent ? <Badge variant="accent">Actual</Badge> : null}
              </div>

              <ul className="mt-5 grid gap-2 text-sm">
                {limits.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[rgb(var(--accent))]"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-2">
                {plan === "FREE" ? (
                  <Badge variant={isCurrent ? "accent" : "outline"}>
                    {isCurrent ? "Plan activo" : "Incluido"}
                  </Badge>
                ) : isCurrent ? (
                  <Badge variant="accent">Suscripcion activa</Badge>
                ) : hasPaidSubscription ? (
                  <BillingActionButton mode="portal">
                    Cambiar a {limits.label}
                  </BillingActionButton>
                ) : (
                  <BillingActionButton mode="checkout" plan={plan}>
                    Actualizar a {limits.label}
                  </BillingActionButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
