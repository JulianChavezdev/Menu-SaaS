"use client";

import {useEffect,useRef,useState} from "react";
import {ArrowLeft,Info,Languages,List,MapPin,Phone,Share2,Volume2,VolumeX,X} from "lucide-react";
import type {Product,Restaurant} from "@/lib/types";

const copy={
  es:{menu:"Carta",close:"Cerrar",share:"Compartir",info:"Restaurante",soundOn:"Activar sonido",soundOff:"Silenciar",website:"Visitar web",categories:"Categorías"},
  en:{menu:"Menu",close:"Close",share:"Share",info:"Restaurant",soundOn:"Turn sound on",soundOff:"Mute",website:"Visit website",categories:"Categories"},
} as const;

export function VideoMenu({restaurant,products}:{restaurant:Restaurant;products:Product[]}){
  const videoRefs=useRef<(HTMLVideoElement|null)[]>([]);
  const sectionRefs=useRef<(HTMLElement|null)[]>([]);
  const[muted,setMuted]=useState(true);
  const[panel,setPanel]=useState<"menu"|"info"|null>(null);
  const[active,setActive]=useState(0);
  const[language,setLanguage]=useState<"es"|"en">(restaurant.locale.startsWith("en")?"en":"es");
  const text=copy[language];
  const categories=[...new Map(products.map(product=>[product.categories?.name??text.menu,product])).entries()];

  useEffect(()=>{
    const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting&&entry.intersectionRatio>.55)setActive(Number((entry.target as HTMLElement).dataset.index??0));
    }),{threshold:[.55]});
    sectionRefs.current.forEach(section=>section&&sectionObserver.observe(section));

    if(matchMedia("(prefers-reduced-motion: reduce)").matches)return()=>sectionObserver.disconnect();
    const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const video=entry.target as HTMLVideoElement;
      if(entry.isIntersecting&&entry.intersectionRatio>.7){
        videoRefs.current.forEach(other=>{if(other&&other!==video){other.pause();other.currentTime=0}});
        void video.play().catch(()=>undefined);
      }else video.pause();
    }),{threshold:[.7]});
    videoRefs.current.forEach(video=>video&&videoObserver.observe(video));
    return()=>{sectionObserver.disconnect();videoObserver.disconnect()};
  },[products]);

  const share=async()=>{try{await navigator.share({title:restaurant.name,url:location.href})}catch{await navigator.clipboard.writeText(location.href)}};
  const go=(id:string)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});setPanel(null)};
  const back=()=>history.length>1?history.back():location.assign("/");

  return <main className="public-menu relative h-dvh overflow-y-auto bg-[#0b0b0a] text-white md:mx-auto md:max-w-[430px] md:border-x md:border-white/10 md:shadow-2xl">
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-30 mx-auto flex max-w-[430px] items-center justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <button aria-label="Volver" onClick={back} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35 backdrop-blur-md"><ArrowLeft size={20}/></button>
      <div className="flex min-w-0 flex-1 justify-center px-3">
        {restaurant.logo_url?<span role="img" aria-label={`Logo de ${restaurant.name}`} className="h-12 w-32 bg-contain bg-center bg-no-repeat drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]" style={{backgroundImage:`url(${restaurant.logo_url})`}}/>:<strong className="truncate text-lg tracking-tight drop-shadow-lg">{restaurant.name}</strong>}
      </div>
      {restaurant.language_switcher_enabled?<button aria-label={language==="es"?"Cambiar a inglés":"Switch to Spanish"} onClick={()=>setLanguage(value=>value==="es"?"en":"es")} className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-white/15 bg-black/35 px-3 text-xs font-bold backdrop-blur-md"><Languages size={17}/>{language.toUpperCase()}</button>:<span className="h-10 w-10"/>}
    </header>

    <div aria-hidden="true" className="pointer-events-none fixed right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 md:right-[calc((100vw-430px)/2+12px)]">
      {products.map((product,index)=><span key={product.id} className={`w-1 rounded-full bg-white transition-all ${active===index?"h-6 opacity-90":"h-1 opacity-35"}`}/>) }
    </div>

    {panel&&<div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/65 p-3 backdrop-blur-sm" onClick={()=>setPanel(null)}>
      <aside aria-label={panel==="menu"?text.categories:text.info} className="w-full rounded-[28px] border border-white/10 bg-[#171715] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl" onClick={event=>event.stopPropagation()}>
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">{restaurant.name}</p><h2 className="mt-1 text-2xl font-semibold">{panel==="menu"?text.categories:text.info}</h2></div><button aria-label={text.close} onClick={()=>setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X size={20}/></button></div>
        {panel==="menu"?<nav className="mt-5 grid gap-2">{categories.map(([name,product],index)=><button key={name} onClick={()=>go(`product-${product.id}`)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left transition hover:bg-white/10"><span className="font-medium">{name}</span><span className="text-sm tabular-nums text-white/45">{String(index+1).padStart(2,"0")}</span></button>)}</nav>:<div className="mt-5 space-y-4 text-sm leading-relaxed text-white/70">{restaurant.description&&<p>{restaurant.description}</p>}{restaurant.address&&<p className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-amber-300" size={18}/><span>{restaurant.address}</span></p>}{restaurant.phone&&<a className="flex gap-3 text-white" href={`tel:${restaurant.phone}`}><Phone className="shrink-0 text-amber-300" size={18}/>{restaurant.phone}</a>}<div className="flex flex-wrap gap-2">{restaurant.instagram_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.instagram_url}>Instagram</a>}{restaurant.website_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.website_url}>{text.website}</a>}</div></div>}
      </aside>
    </div>}

    <div className="snap-y snap-mandatory">
      {products.map((product,index)=><section ref={element=>{sectionRefs.current[index]=element}} data-index={index} id={`product-${product.id}`} key={product.id} className="relative isolate flex min-h-dvh snap-start items-end overflow-hidden px-5 pb-32 pt-28">
        <div className="absolute inset-0 -z-20 bg-[#22221f]">{product.video_url?<video ref={element=>{videoRefs.current[index]=element}} src={product.video_url} poster={product.image_url??undefined} muted={muted} loop playsInline preload="metadata" className="h-full w-full object-cover"/>:<div className="h-full w-full bg-cover bg-center" style={{backgroundImage:product.image_url?`url(${product.image_url})`:undefined}}/>}</div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.35)_0%,transparent_28%,transparent_47%,rgba(0,0,0,.92)_100%)]"/>
        <div className="w-full text-shadow-lg">
          <div className="mb-3 flex items-center gap-3"><span className="rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[.18em] text-amber-200 backdrop-blur-md">{product.categories?.name}</span>{product.is_featured&&<span className="text-xs font-medium text-white/70">★ Destacado</span>}</div>
          <h1 className="max-w-[340px] text-[clamp(2rem,9vw,3rem)] font-semibold leading-[.98] tracking-[-.04em]">{product.name}</h1>
          {product.description&&<p className="mt-3 line-clamp-3 max-w-[350px] text-[15px] leading-relaxed text-white/72">{product.description}</p>}
          <div className="mt-5 flex items-end justify-between"><strong className="text-2xl font-semibold tabular-nums">{new Intl.NumberFormat(language==="es"?"es-ES":"en-US",{style:"currency",currency:restaurant.currency}).format(product.price_cents/100)}</strong><span className="text-xs font-medium tabular-nums text-white/50">{String(index+1).padStart(2,"0")} / {String(products.length).padStart(2,"0")}</span></div>
        </div>
      </section>)}
    </div>

    <nav aria-label="Controles de la carta" className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-[398px] -translate-x-1/2 items-center justify-around rounded-2xl border border-white/15 bg-[#171715]/90 px-2 py-2 shadow-2xl backdrop-blur-xl">
      <button aria-label={text.menu} onClick={()=>setPanel("menu")} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/75"><List size={20}/>{text.menu}</button>
      <button aria-label={muted?text.soundOn:text.soundOff} onClick={()=>setMuted(value=>!value)} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/75">{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}Audio</button>
      <button aria-label={text.info} onClick={()=>setPanel("info")} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/75"><Info size={20}/>{text.info}</button>
      <button aria-label={text.share} onClick={share} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/75"><Share2 size={20}/>{text.share}</button>
    </nav>
  </main>;
}
