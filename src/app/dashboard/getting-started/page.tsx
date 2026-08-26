import Link from "next/link";
import {ArrowRight, Check, Circle, Eye, FolderPlus, UtensilsCrossed} from "lucide-react";
import {activeRestaurant} from "@/lib/permissions";

export default async function GettingStarted(){
  const{supabase,restaurant}=await activeRestaurant();
  const[{count:categories},{count:products},{data:subscription}]=await Promise.all([
    supabase.from("categories").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id),
    supabase.from("subscriptions").select("plan,status,current_period_end").eq("restaurant_id",restaurant.id).maybeSingle(),
  ]);
  const steps=[
    {title:"Crea una categoría",description:"Organiza la carta: hamburguesas, entrantes, bebidas o postres.",href:"/dashboard/menu#categorias",action:"Crear categoría",done:(categories??0)>0,icon:FolderPlus},
    {title:"Publica tu primer producto",description:"Añade nombre, precio, descripción y asígnalo a una categoría.",href:"/dashboard/menu#productos",action:"Añadir producto",done:(products??0)>0,icon:UtensilsCrossed},
    {title:"Publica la carta",description:"Activa la carta y abre la vista del cliente para comprobarla.",href:"/dashboard/restaurant#publicacion",action:"Publicar carta",done:restaurant.is_published,icon:Eye},
  ];
  const completed=steps.filter(step=>step.done).length;
  const planActive=subscription?.status==="active"||subscription?.status==="trialing";
  return <main className="mx-auto min-h-screen max-w-4xl p-4 md:p-8">
    <header className="border-b border-stone-200 pb-6">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-700">Bienvenido a Menuly</p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">Tu carta puede estar publicada en pocos minutos</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">Sigue estas tres acciones. La guía se actualizará automáticamente con lo que vayas completando.</p>
      <div className={`mt-5 flex flex-wrap items-center gap-3 border p-4 text-sm ${planActive?"border-emerald-200 bg-emerald-50 text-emerald-950":"border-amber-200 bg-amber-50 text-amber-950"}`}>
        <Check size={20}/><strong>{planActive?"Tu plan está activo. Ya puedes configurar y publicar tu carta.":"Tu plan está pendiente de activación."}</strong>
        {!planActive&&<Link href="/dashboard/billing" className="font-bold underline underline-offset-4">Solicitar activación</Link>}
      </div>
    </header>
    <section className="mt-6">
      <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Guía rápida</h2><span className="text-sm font-semibold text-slate-600">{completed}/3 completados</span></div>
      <div className="mt-3 h-2 overflow-hidden bg-stone-200"><div className="h-full bg-orange-600 transition-all" style={{width:`${completed/3*100}%`}}/></div>
      <ol className="mt-5 grid gap-3">
        {steps.map((step,index)=><li key={step.title} className={`border p-4 md:p-5 ${step.done?"border-emerald-200 bg-emerald-50/60":"border-stone-200 bg-white"}`}>
          <div className="flex items-start gap-4"><span className={`grid h-10 w-10 shrink-0 place-items-center ${step.done?"bg-emerald-700 text-white":"bg-orange-100 text-orange-700"}`}>{step.done?<Check size={20}/>:<step.icon size={20}/>}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paso {index+1}</p><h3 className="mt-1 font-bold text-slate-950">{step.title}</h3><p className="mt-1 text-sm text-slate-600">{step.description}</p><Link href={step.href} className="mt-3 inline-flex min-h-11 items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-bold text-white">{step.done?"Revisar":step.action}<ArrowRight size={16}/></Link></div><Circle className={step.done?"fill-emerald-600 text-emerald-600":"text-stone-300"} size={18}/></div>
        </li>)}
      </ol>
    </section>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5"><p className="text-xs text-slate-500">Podrás volver a esta guía desde el panel.</p><Link href="/dashboard" className="text-sm font-bold text-orange-700 underline underline-offset-4">Ir al panel</Link></div>
  </main>;
}
