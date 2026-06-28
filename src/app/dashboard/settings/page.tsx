import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { getUserByEmail } from "@/lib/queries/users";
import { getBillingProfile } from "@/lib/queries/billing";
import { PLAN_LIMITS, normalizePlan } from "@/lib/billing/plans";
import { signOutAction } from "@/app/dashboard/actions";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRow = session.user.email
    ? await getUserByEmail(session.user.email)
    : null;
  const billing = await getBillingProfile(session.user.id);
  const plan = normalizePlan(billing?.plan ?? userRow?.plan);

  const createdAt = userRow?.created_at
    ? new Date(userRow.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="card p-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      <p className="mt-1 text-sm text-muted">
        Información de tu cuenta en JustWriteIt.
      </p>

      <div
        className="mt-6 rounded-[var(--radius-lg)] border divide-y"
        style={{ borderColor: "rgb(var(--border))" }}
      >
        {/* Nombre */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border"
            style={{
              borderColor: "rgba(var(--accent),0.22)",
              background: "rgba(var(--accent),0.08)",
            }}
          >
            <User size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Nombre</p>
            <p className="text-sm font-medium truncate">{session.user.name ?? "—"}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border"
            style={{
              borderColor: "rgba(var(--accent),0.22)",
              background: "rgba(var(--accent),0.08)",
            }}
          >
            <Mail size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-medium truncate">{session.user.email ?? "—"}</p>
          </div>
        </div>

        {/* Miembro desde */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border"
            style={{
              borderColor: "rgba(var(--accent),0.22)",
              background: "rgba(var(--accent),0.08)",
            }}
          >
            <Calendar size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Miembro desde</p>
            <p className="text-sm font-medium">{createdAt}</p>
          </div>
        </div>

        {/* Plan */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border"
            style={{
              borderColor: "rgba(var(--accent),0.22)",
              background: "rgba(var(--accent),0.08)",
            }}
          >
            <Shield size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Plan</p>
            <p className="text-sm font-medium">{PLAN_LIMITS[plan].label}</p>
          </div>
        </div>
      </div>

      {/* Cerrar sesión */}
      <div className="mt-6">
        <form action={signOutAction}>
          <button
            type="submit"
            className="btn text-sm font-medium"
            style={{
              background: "rgba(var(--danger),0.08)",
              color: "rgb(var(--danger))",
              border: "1px solid rgba(var(--danger),0.30)",
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
