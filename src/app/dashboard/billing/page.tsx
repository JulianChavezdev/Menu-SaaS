import {Check,Crown,LockKeyhole} from "lucide-react";
import {activeRestaurant} from "@/lib/permissions";
import {BackButton} from "@/components/ui/back-button";
import {PLAN_LIMITS,planForStatus} from "@/lib/plans";
import {checkoutIsConfigured} from "@/lib/billing";
import {startCheckout} from "@/app/dashboard/actions";
import {trialDaysRemaining} from "@/lib/trial-expiration";

export default async function Page({searchParams}:{searchParams:Promise<{from?:string;checkout?:string}>}){
  const {from,checkout}=await searchParams;
  const {supabase,restaurant}=await activeRestaurant();
  const[{data:subscription},{count:products},{count:categories}]=await Promise.all([
    supabase.from("subscriptions").select("plan,status,provider,current_period_end").eq("restaurant_id",restaurant.id).maybeSingle(),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id),
    supabase.from("categories").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id),
  ]);
  const status=subscription?.status??restaurant.subscription_status??"trialing";
  const plan=planForStatus(status);const limits=PLAN_LIMITS[plan];const active=plan==="carta";
  const productProgress=Math.min(100,Math.round(((products??0)/limits.products)*100));
  const categoryLimit=Number.isFinite(limits.categories)?limits.categories:null;
  const checkoutReady=checkoutIsConfigured(process.env.STRIPE_SECRET_KEY,process.env.STRIPE_PLAN_PRICE_ID);
  const trialDays=status==="trialing"?trialDaysRemaining(subscription?.current_period_end):null;
  return <main className="mx-auto max-w-5xl p-4 md:p-6">
    <div className="border-b border-slate-800 pb-4"><BackButton fallback="/dashboard"/><h1 className="mt-4 text-2xl font-extrabold">Suscripción</h1><p className="mt-1 text-sm text-slate-400">Gestiona los límites y las funciones premium de tu restaurante.</p></div>
    {from==="templates"&&!active&&<div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100"><strong>Las plantillas premium forman parte del Plan Carta.</strong><span className="mt-1 block text-amber-100/70">Activa el plan para seleccionarlas y mantenerlas publicadas.</span></div>}
    {subscription?.provider==="manual"&&active&&<div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100"><strong>Suscripción gestionada manualmente.</strong><span className="mt-1 block text-emerald-100/70">Tu pago ha sido confirmado y no se realizará ningún cobro automático.</span></div>}
    {!active&&<div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"><strong>{status==="trialing"?`Periodo de prueba: ${trialDays??7} día${trialDays===1?"":"s"} restante${trialDays===1?"":"s"}.`:"Pago necesario para publicar la carta."}</strong><span className="mt-1 block text-amber-100/75">La prueba dura 7 días. Al terminar, la carta pública se suspende hasta que se registre un pago.</span></div>}
    {checkout==="success"&&<div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100"><strong>Checkout completado.</strong><span className="mt-1 block text-emerald-100/70">Estamos verificando la suscripción con Stripe.</span></div>}
    {checkout==="canceled"&&<div className="mt-5 rounded-2xl border border-slate-600 bg-slate-800/50 p-4 text-sm text-slate-300">El pago se canceló y no se realizó ningún cambio.</div>}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 shadow-xl md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase text-violet-300">{active?"Plan activo":"Prueba"}</span><h2 className="mt-3 text-2xl font-bold">{active?"Plan Carta":"Plan de prueba"}</h2><p className="mt-1 text-sm text-slate-400">{active?"Tu carta dispone de las funciones profesionales.":"3 productos y un máximo de 5 categorías."}</p></div><span className={`rounded-lg border px-3 py-1 text-xs font-semibold capitalize ${active?"border-emerald-500/30 bg-emerald-500/10 text-emerald-300":"border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{status}</span></div>
        <div className="my-6 border-t border-slate-800"/>
        <Usage label="Productos" used={products??0} limit={limits.products} progress={productProgress}/><div className="mt-5"><Usage label="Categorías" used={categories??0} limit={categoryLimit}/></div>
        {subscription?.current_period_end&&<p className="mt-5 text-xs text-slate-500">Periodo actual hasta {new Intl.DateTimeFormat("es-ES",{dateStyle:"long"}).format(new Date(subscription.current_period_end))}.</p>}
      </section>
      <section className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl md:p-7 ${active?"border-emerald-400/30 bg-emerald-400/[.06]":"border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-cyan-500/5"}`}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white"><Crown size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">Plan Carta</p><h2 className="text-2xl font-bold">Todo lo necesario para crecer</h2></div></div>
          <ul className="mt-6 grid gap-3 text-sm">{["Hasta 100 productos","Categorías ilimitadas","Plantillas premium","Vídeos, código QR e idiomas","Gestión de equipo"].map(item=><li key={item} className="flex items-center gap-3"><Check className="shrink-0 text-emerald-400" size={18}/>{item}</li>)}</ul>
          {active?<div className="mt-7 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"><Check size={18}/>Tu restaurante ya tiene acceso.</div>:<form action={startCheckout} className="mt-7"><button disabled={!checkoutReady} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-500/20 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"><LockKeyhole size={18}/>{checkoutReady?"Mejorar al Plan Carta":"Suscripciones no disponibles en la beta"}</button>{!checkoutReady&&<p className="mt-3 text-center text-xs text-slate-500">Seguimos desarrollando el producto; no se realizará ningún cobro durante esta fase.</p>}</form>}
        </div>
      </section>
    </div>
  </main>;
}

function Usage({label,used,limit,progress}:{label:string;used:number;limit:number|null;progress?:number}){const percentage=progress??(limit?Math.min(100,Math.round((used/limit)*100)):0);return <div><div className="flex justify-between text-sm"><span>{label}</span><span>{used} / {limit??"∞"}</span></div>{limit&&<div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900"><div className={`h-full rounded-full ${percentage>=90?"bg-amber-500":"bg-violet-500"}`} style={{width:`${percentage}%`}}/></div>}</div>}
