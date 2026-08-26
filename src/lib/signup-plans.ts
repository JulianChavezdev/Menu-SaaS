export const SIGNUP_PLANS = [
  {
    id: "carta",
    name: "Plan Carta",
    price: "34,99 €/mes · 344,30 €/año",
    description:
      "Hasta 100 productos, 6 plantillas, foto y vídeo, QR, idiomas y analíticas.",
  },
  {
    id: "pedidos",
    name: "Menuly Comandas",
    price: "59,99 €/mes · 590,30 €/año",
    description:
      "Todo el Plan Carta más comandero móvil, mesas y Cocina en tiempo real.",
  },
  {
    id: "configuracion",
    name: "Configuración completa",
    price: "149,99 €",
    description:
      "Grabación, edición con IA, puesta en marcha y dos meses de Plan Carta.",
  },
] as const;

export type SignupPlanId = (typeof SIGNUP_PLANS)[number]["id"];

export function isSignupPlanId(value: unknown): value is SignupPlanId {
  return SIGNUP_PLANS.some((plan) => plan.id === value);
}

export function signupPlan(value: unknown): SignupPlanId {
  return isSignupPlanId(value) ? value : "carta";
}

export function trialDaysRemaining(end: string | Date, now = new Date()) {
  const milliseconds = new Date(end).getTime() - now.getTime();
  return Math.max(0, Math.ceil(milliseconds / 86_400_000));
}

export type TrialUrgency = "normal" | "soon" | "urgent" | "last-day";

export function trialUrgency(days: number): TrialUrgency {
  if (days <= 1) return "last-day";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}

export function signupPlanName(value: unknown) {
  const id = signupPlan(value);
  return SIGNUP_PLANS.find((plan) => plan.id === id)!.name;
}
