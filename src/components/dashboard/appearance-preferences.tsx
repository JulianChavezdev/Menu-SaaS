"use client";

import {useEffect,useState,useTransition} from "react";
import Link from "next/link";
import {Eye,Languages,Lock,X} from "lucide-react";
import {toast} from "sonner";
import {translateEntireMenu,updateAppearancePreferences} from "@/app/dashboard/actions";
import {MENU_TEMPLATES,resolveMenuTemplate,type MenuTemplateKey} from "@/lib/menu-templates";
import {ThemeVectors} from "@/components/menu/theme-vectors";
import {notifyAutomaticTranslation} from "@/components/dashboard/automatic-translation";

type PreviewProduct={name:string;priceCents:number;videoUrl:string|null;category:string};
type PreviewProps={kind:MenuTemplateKey;restaurantName:string;logoUrl:string|null;currency:string;product?:PreviewProduct;large?:boolean};

function TemplatePreview({kind,restaurantName,logoUrl,currency,product,large=false}:PreviewProps){
  const template=MENU_TEMPLATES[kind];
  const {colors}=template;
  const framed=template.layout==="framed";
  const card=template.layout!=="fullscreen";
  const price=new Intl.NumberFormat("es-ES",{style:"currency",currency}).format((product?.priceCents??1290)/100);
  return <div style={{background:colors.background}} className={`relative isolate mx-auto w-full overflow-hidden text-white shadow-2xl ${large?"h-[min(70dvh,620px)] max-w-[350px] rounded-[32px]":"aspect-[9/12] rounded-2xl"}`}>
    <div style={{borderColor:colors.frame}} className={`absolute z-0 overflow-hidden ${framed?"inset-2 bottom-14 rounded-[22px] border":"inset-0"}`}>
      {product?.videoUrl
        ?<video src={product.videoUrl} muted loop autoPlay playsInline className="h-full w-full object-cover"/>
        :<div className="h-full w-full" style={{background:`radial-gradient(circle at 65% 25%,${colors.accent2}99,${colors.panel} 48%,${colors.background})`}}/>
      }
    </div>
    <div className={`absolute z-[1] ${framed?"inset-2 bottom-14 rounded-[22px]":"inset-0"}`} style={{background:`linear-gradient(to bottom,${colors.background}33,transparent 42%,${colors.background}f2)`}}/>
    <ThemeVectors motif={template.motif} accent={colors.accent} accent2={colors.accent2} className="absolute inset-0 z-[2] h-full w-full"/>
    <div className="absolute left-3 right-3 top-3 z-10 flex h-8 items-center justify-center">{logoUrl?<span role="img" aria-label={`Logo de ${restaurantName}`} className="h-8 w-24 bg-contain bg-center bg-no-repeat drop-shadow-lg" style={{backgroundImage:`url(${logoUrl})`}}/>:<strong className={`${large?"text-base":"text-[10px]"} drop-shadow-lg`}>{restaurantName}</strong>}</div>
    <div style={card?{background:`${colors.panel}d9`,borderColor:colors.frame}:undefined} className={`absolute z-10 ${card?"bottom-16 left-4 right-4 rounded-2xl border p-3 backdrop-blur-md":"bottom-4 left-4 right-4"}`}>
      <p style={{color:colors.accent}} className={`truncate font-bold uppercase tracking-[.15em] ${large?"text-[10px]":"text-[7px]"}`}>{product?.category??"Especialidades"}</p>
      <p className={`mt-1 line-clamp-2 font-semibold leading-none ${large?"text-2xl":"text-sm"}`}>{product?.name??"Producto destacado"}</p>
      <p style={{color:colors.accent}} className={`mt-2 font-bold ${large?"text-lg":"text-xs"}`}>{price}</p>
    </div>
    <div style={{background:colors.nav,borderColor:colors.frame}} className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-3 rounded-xl border px-4 py-2">{[0,1,2,3].map(item=><span key={item} style={{background:item===0?colors.accent:"rgba(255,255,255,.55)"}} className="h-1.5 w-1.5 rounded-full"/>)}</div>
  </div>;
}

export function AppearancePreferences({enabled,template,canUsePremium,restaurantName,logoUrl,currency,previewProduct}:{enabled:boolean;template?:string;canUsePremium:boolean;restaurantName:string;logoUrl:string|null;currency:string;previewProduct?:PreviewProduct}){
  const current=resolveMenuTemplate(template,canUsePremium);
  const[selected,setSelected]=useState<MenuTemplateKey>(current.key);
  const[preview,setPreview]=useState<MenuTemplateKey|null>(null);
  const[translating,startTranslation]=useTransition();
  useEffect(()=>{
    if(!preview)return;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setPreview(null)};
    addEventListener("keydown",closeOnEscape);
    return()=>removeEventListener("keydown",closeOnEscape);
  },[preview]);
  return <>
    <form action={async form=>{try{const result=await updateAppearancePreferences(form);toast.success("Preferencias guardadas");notifyAutomaticTranslation(result.translationStatus)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}}} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <section>
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-bold">Plantillas de la carta</h2><p className="mt-1 text-sm text-slate-400">Previsualiza cada estilo antes de elegirlo.</p></div><span className="text-xs text-slate-500">{Object.keys(MENU_TEMPLATES).length} disponibles</span></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.values(MENU_TEMPLATES).map(item=>{const locked=item.tier==="premium"&&!canUsePremium;return <article key={item.key} className={`rounded-2xl border p-3 transition ${item.key===selected?"border-violet-400/70 bg-violet-500/10":"border-white/10 bg-white/[.02]"}`}>
            <TemplatePreview kind={item.key} restaurantName={restaurantName} logoUrl={logoUrl} currency={currency} product={previewProduct}/>
            <div className="mt-3 flex items-start gap-2"><label className={`flex min-w-0 flex-1 gap-2 ${locked?"cursor-not-allowed opacity-60":"cursor-pointer"}`}><input aria-label={`Seleccionar plantilla ${item.name}`} type="radio" name="menu_template" value={item.key} checked={item.key===selected} onChange={()=>setSelected(item.key)} disabled={locked} className="mt-1 h-4 w-4 shrink-0 accent-violet-500"/><span className="min-w-0"><strong className="block">{item.name}</strong><span className="mt-1 block text-xs leading-relaxed text-slate-400">{item.description}</span></span></label>{item.tier==="premium"&&<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[9px] font-bold uppercase text-amber-300"><Lock size={10}/>Pro</span>}</div>
            <button type="button" onClick={()=>setPreview(item.key)} aria-label={`Vista previa de ${item.name}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10"><Eye size={15}/>Vista previa</button>
          </article>})}
        </div>
        {!canUsePremium&&<div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[.06] p-3 text-xs text-slate-400"><span>Puedes previsualizar las plantillas premium antes de activarlas.</span><Link href="/dashboard/billing?from=templates" className="font-semibold text-amber-300 hover:text-amber-200">Ver Plan Carta →</Link></div>}
      </section>
      <section className="border-t border-white/10 pt-5"><h2 className="font-bold">Idiomas de la carta</h2><p className="mt-1 text-sm text-slate-400">Permite cambiar los controles públicos entre español e inglés. El restaurante solo escribe en español.</p><label className="mt-4 flex items-center gap-3"><input name="language_switcher_enabled" type="checkbox" defaultChecked={enabled} className="h-5 w-5 accent-violet-500"/><span>Mostrar selector de idioma</span></label><button type="button" disabled={translating} onClick={()=>startTranslation(async()=>{try{const result=await translateEntireMenu();notifyAutomaticTranslation(result.translationStatus);if(result.translationStatus==="translated")toast.success(`${result.translatedCount} elementos traducidos`)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo traducir la carta")}})} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] px-4 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-50"><Languages size={17}/>{translating?"Traduciendo carta…":"Traducir ahora toda la carta"}</button></section>
      <button className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold">Guardar preferencias</button>
    </form>

    {preview&&<div role="dialog" aria-modal="true" aria-label={`Vista previa de ${MENU_TEMPLATES[preview].name}`} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md" onClick={()=>setPreview(null)}><div className="relative w-full max-w-[390px]" onClick={event=>event.stopPropagation()}><button type="button" onClick={()=>setPreview(null)} aria-label="Cerrar vista previa" className="absolute -right-1 -top-12 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950"><X size={20}/></button><TemplatePreview large kind={preview} restaurantName={restaurantName} logoUrl={logoUrl} currency={currency} product={previewProduct}/><p className="mt-3 text-center text-sm font-semibold text-white">{MENU_TEMPLATES[preview].name}</p></div></div>}
  </>;
}
