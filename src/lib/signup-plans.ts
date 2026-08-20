export const TRIAL_DAYS = 30;

export const SIGNUP_PLANS = [
  {
    id: "carta",
    name: "Plan Carta",
    price: "34,99 €/mes",
    description: "Carta digital en foto y vídeo, QR, idiomas y analíticas.",
  },
  {
    id: "pedidos",
    name: "Menuly Pedidos",
    price: "59,99 €/mes",
    description: "Todo el Plan Carta más pedidos por mesa y pantalla de cocina.",
  },
  {
    id: "configuracion",
    name: "Configuración completa",
    price: "149,99 €",
    description: "Grabación, edición con IA y puesta en marcha realizada por Menuly.",
  },
] as const;

export type SignupPlanId = (typeof SIGNUP_PLANS)[number]["id"];

export function isSignupPlanId(value: unknown): value is SignupPlanId {
  return SIGNUP_PLANS.some((plan) => plan.id === value);
}

export function signupPlan(value: unknown): SignupPlanId {
  return isSignupPlanId(value) ? value : "carta";
}

export function trialEndsAt(now = new Date()) {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + TRIAL_DAYS);
  return end;
}

