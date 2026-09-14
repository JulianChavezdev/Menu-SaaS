import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Circle } from "lucide-react";
import type { OnboardingInput } from "@/lib/onboarding";
import { restaurantOnboarding } from "@/lib/onboarding";

export function OnboardingChecklist({ input }: { input: OnboardingInput }) {
  const onboarding = restaurantOnboarding(input);
  return (
    <details open={!onboarding.complete} className="workspace-checklist">
      <summary>
        <div>
          <h2>
            {onboarding.complete
              ? "Configuración de la carta completada"
              : "Prepara tu carta"}
          </h2>
          <p>
            {onboarding.complete
              ? "Revisa los pasos de configuración cuando lo necesites."
              : "Completa estos pasos para empezar a recibir visitas."}
          </p>
        </div>
        <span>
          {onboarding.completed} de {onboarding.total}
          <ChevronDown className="ml-3 inline" size={14} />
        </span>
      </summary>
      <div className="workspace-checklist-steps">
        {onboarding.steps.map((step) => (
          <Link key={step.id} href={step.href}>
            {step.done ? (
              <Check size={16} className="shrink-0 text-emerald-700" />
            ) : (
              <Circle size={15} className="shrink-0 text-stone-400" />
            )}
            <div>
              <strong>{step.label}</strong>
              <p>{step.description}</p>
            </div>
            <ArrowRight size={14} className="ml-auto shrink-0 text-stone-400" />
          </Link>
        ))}
      </div>
    </details>
  );
}
