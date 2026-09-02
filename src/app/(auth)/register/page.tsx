"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SIGNUP_PLANS, signupPlan } from "@/lib/signup-plans";
import { AuthMenuShowcase } from "@/components/marketing/auth-menu-showcase";

export default function Register() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("carta");
  const router = useRouter();
  useEffect(()=>setSelectedPlan(signupPlan(new URLSearchParams(window.location.search).get("plan"))),[]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(pending)return;
    setPending(true);
    const f = new FormData(e.currentTarget);
    const plan = signupPlan(f.get("plan"));
    const { data, error } = await createClient().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(`/onboarding?plan=${plan}`)}`,
        data: { plan_interest: plan },
      },
    });
    if (!error && data.user) {
      await fetch("/api/alerts/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch(() => undefined);
    }
    if (!error && data.session) {
      router.push(`/onboarding?plan=${plan}`);
      router.refresh();
      return;
    }
    setMessage(error ? error.message : "Revisa tu correo para confirmar la cuenta.");
    setPending(false);
  }

  return (
    <main className="grid min-h-dvh overflow-hidden bg-[#d99a38] selection:bg-orange-600/30 min-[900px]:grid-cols-[52%_48%]">
      <div className="grid min-h-dvh place-items-center px-4 py-3 sm:px-6">
        <form
          onSubmit={submit}
          aria-busy={pending}
          className="relative w-full max-w-[460px] rounded-xl border border-stone-300 bg-white p-5 shadow-md ring-1 ring-stone-200 sm:p-6"
        >
   
        <div className="mb-4">
          <Link href="/" aria-label="Menuly · Inicio" className="inline-flex"><BrandLogo priority className="w-[135px]"/></Link>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-slate-950">
            Crea tu cuenta
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
            Elige el plan que te interesa. Te ayudaremos a activarlo y ponerlo en marcha.
          </p>
        </div>

     
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input 
              name="email" 
              required 
              type="email" 
              autoComplete="email"
              placeholder="tu@restaurante.com"
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-2.5 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
            <PasswordInput 
              id="register-password"
              name="password" 
              required 
              minLength={8} 
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-2.5 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">¿Qué plan te interesa?</legend>
            <div className="mt-1.5 grid gap-1.5">
              {SIGNUP_PLANS.map((plan) => (
                <label key={plan.id} className={`cursor-pointer rounded-xl border px-3 py-2 transition ${selectedPlan===plan.id?"border-orange-500 bg-orange-50":"border-stone-200 bg-white hover:border-stone-400"}`}>
                  <span className="flex items-start gap-3">
                    <input name="plan" type="radio" value={plan.id} checked={selectedPlan===plan.id} onChange={()=>setSelectedPlan(plan.id)} className="mt-1" />
                    <span className="min-w-0"><strong className="flex flex-wrap justify-between gap-2 text-sm text-slate-950"><span>{plan.name}</span><span className="text-orange-700">{plan.price}</span></strong><span className="mt-0.5 block text-[11px] leading-4 text-slate-600">{plan.description}</span></span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

        </div>

     
        <button disabled={pending} className="mt-4 w-full rounded-xl bg-orange-600 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-wait disabled:opacity-60">
          {pending?"Creando cuenta…":"Crear cuenta"}
        </button>

   
        {message && (
          <div 
            role="alert" 
            className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
              message.includes("Revisa tu correo") 
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
                : "border-red-500/20 bg-red-500/10 text-red-700"
            }`}
          >
            <span>{message.includes("Revisa tu correo") ? "📩" : "⚠️"}</span>
            <span>{message}</span>
          </div>
        )}

    
        <p className="mt-3 text-center text-xs text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-medium text-orange-700 hover:text-orange-700 underline underline-offset-4" href="/login">
            Inicia sesión
          </Link>
        </p>
        </form>
      </div>
      <AuthMenuShowcase />
    </main>
  );
}
