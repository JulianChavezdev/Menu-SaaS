import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { activeRestaurant } from "@/lib/permissions";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import {ActionCenter} from "@/components/dashboard/action-center";
import {restaurantAlerts} from "@/lib/restaurant-alerts";
import {trialDaysRemaining} from "@/lib/trial-expiration";

export default async function Dashboard() {
  const { restaurant, supabase } = await activeRestaurant();

  const since=new Date();since.setUTCDate(since.getUTCDate()-6);
  const [{ count: products }, { count: categories }, { count: videos }, { count: media },{count:productsWithoutMedia},{data:subscription},{data:analytics}] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .not("video_url", "is", null),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .or("video_url.not.is.null,image_url.not.is.null"),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id).is("video_url",null).is("image_url",null),
    supabase.from("subscriptions").select("status,current_period_end").eq("restaurant_id",restaurant.id).maybeSingle(),
    supabase.from("menu_analytics_daily").select("event_type,event_count").eq("restaurant_id",restaurant.id).gte("event_date",since.toISOString().slice(0,10)),
  ]);
  const eventTotal=(type:string)=>(analytics??[]).filter(row=>row.event_type===type).reduce((total,row)=>total+Number(row.event_count||0),0);
  const status=subscription?.status??restaurant.subscription_status;const alerts=restaurantAlerts({subscriptionStatus:status,trialDays:status==="trialing"?trialDaysRemaining(subscription?.current_period_end):null,published:restaurant.is_published,products:products??0,productsWithoutMedia:productsWithoutMedia??0,menuViews:eventTotal("menu_view"),cartAdds:eventTotal("cart_add"),recommendationAdds:eventTotal("recommendation_add"),hasLogo:Boolean(restaurant.logo_url),hasContact:Boolean(restaurant.phone||restaurant.address)});

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 animate-in fade-in duration-300 min-h-screen flex flex-col justify-start">
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-200 pb-5 gap-4">
        <div className="flex flex-col gap-1">
          <BackButton fallback="/" />
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Hola, {restaurant.name}
          </h1>
          <p className="text-sm text-slate-600">
            Gestiona productos, identidad corporativa y la disponibilidad de tu negocio.
          </p>
        </div>

        {/* Estado Dinámico de la Carta */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estado:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold border ${
            restaurant.is_published 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${restaurant.is_published ? "bg-emerald-400" : "bg-amber-400"}`} />
            {restaurant.is_published ? 'Publicada' : 'Borrador'}
          </span>
        </div>
      </div>

      <OnboardingChecklist input={{hasLogo:Boolean(restaurant.logo_url),hasContact:Boolean(restaurant.phone||restaurant.address),categories:categories??0,products:products??0,media:media??0,published:restaurant.is_published}} />
      <ActionCenter alerts={alerts}/>

      {/* Módulo de Estadísticas Clave */}
      <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="border-l-4 border-l-orange-500 border-y border-r border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {products ?? 0}
          </p>
        </div>
        
        <div className="border-l-4 border-l-emerald-500 border-y border-r border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorías</p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {categories ?? 0}
          </p>
        </div>

        <div className="col-span-2 border-l-4 border-l-amber-500 border-y border-r border-stone-200 bg-white p-5 shadow-sm lg:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vídeos enlazados</p>
          <p className="mt-2 text-3xl font-black text-orange-700">
            {videos ?? 0}
          </p>
        </div>
      </section>

      {/* Grid Bento de Herramientas de Control */}
      <h2 className="mt-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Herramientas del panel</h2>
      
      <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Enlace Principal: Gestor de la Carta */}
        <Link 
          href="/dashboard/menu" 
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-orange-500/50 hover:bg-stone-50"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center bg-orange-100 text-lg">
              📋
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-orange-900">Gestionar catálogo de carta</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Modifica la estructura de tus platos, organiza el orden de tus menús y edita la disponibilidad en tiempo real.
            </p>
          </div>
          <span className="mt-6 text-xs font-semibold text-orange-700 group-hover:text-orange-700 flex items-center gap-1">
            Abrir administrador de carta →
          </span>
        </Link>

        {/* Enlace Secundario: Vista Previa Pública */}
        <a 
          href={`/r/${restaurant.slug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-stone-400 hover:bg-stone-50"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 border border-stone-200 text-lg group-hover:border-slate-700">
              🎥
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-slate-950">Ver carta interactiva pública</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Visualiza en vivo la interfaz móvil interactiva que escanearán tus clientes finales en las mesas.
            </p>
          </div>
          <span className="mt-6 text-xs font-semibold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
            Abrir URL en pestaña nueva ↗
          </span>
        </a>
      </div>
    </main>
  );
}
