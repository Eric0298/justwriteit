export const FREE_DAILY_TRANSCRIPTION_LIMIT = 3;

export const PLAN_IDS = ["FREE", "PRO", "PREMIUM"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanLimits = {
  id: PlanId;
  label: string;
  dailyTranscriptionLimit: number;
  maxAudioFileSizeMb: number;
  features: string[];
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  FREE: {
    id: "FREE",
    label: "Gratis",
    dailyTranscriptionLimit: FREE_DAILY_TRANSCRIPTION_LIMIT,
    maxAudioFileSizeMb: 25,
    features: [
      "3 transcripciones al dia",
      "Archivos de audio de hasta 25MB",
      "Historial privado",
    ],
  },
  PRO: {
    id: "PRO",
    label: "Pro",
    dailyTranscriptionLimit: 50,
    maxAudioFileSizeMb: 50,
    features: [
      "50 transcripciones al dia",
      "Archivos de audio de hasta 50MB",
      "Historial privado ampliado",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    label: "Premium",
    dailyTranscriptionLimit: 200,
    maxAudioFileSizeMb: 100,
    features: [
      "200 transcripciones al dia",
      "Archivos de audio de hasta 100MB",
      "Limites superiores para uso intensivo",
    ],
  },
};

export function normalizePlan(plan: string | null | undefined): PlanId {
  const value = String(plan ?? "FREE").toUpperCase();
  return PLAN_IDS.includes(value as PlanId) ? (value as PlanId) : "FREE";
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)];
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "FREE";
}

export function getRemainingTranscriptions(input: {
  plan: string | null | undefined;
  usedToday: number;
}): number {
  const limits = getPlanLimits(input.plan);
  return Math.max(0, limits.dailyTranscriptionLimit - input.usedToday);
}

export function buildUsageMessage(input: {
  plan: string | null | undefined;
  usedToday: number;
}): string {
  const plan = normalizePlan(input.plan);
  const limits = getPlanLimits(plan);
  const remaining = getRemainingTranscriptions({ plan, usedToday: input.usedToday });

  if (plan === "FREE") {
    if (remaining === 0) {
      return "Has usado tus 3 transcripciones gratuitas de hoy. Actualiza tu plan para continuar.";
    }
    if (remaining === 1) return "Te queda 1 transcripcion gratuita hoy.";
    return `Te quedan ${remaining} transcripciones gratuitas hoy.`;
  }

  if (remaining === 0) {
    return `Has alcanzado el limite diario de tu plan ${limits.label}.`;
  }

  return `Plan ${limits.label}: te quedan ${remaining} transcripciones hoy.`;
}

