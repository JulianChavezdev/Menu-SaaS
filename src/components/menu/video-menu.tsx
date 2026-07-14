"use client";

import {useEffect,useRef,useState,type CSSProperties} from "react";
import {ArrowLeft,Info,Languages,List,MapPin,Phone,Share2,Volume2,VolumeX,X} from "lucide-react";
import type {Product,Restaurant} from "@/lib/types";
import {resolveMenuTemplate} from "@/lib/menu-templates";
import {translatedField} from "@/lib/translations";
import {ThemeVectors} from "@/components/menu/theme-vectors";
import type {AnalyticsEvent} from "@/lib/analytics";
import {ProductMedia} from "@/components/menu/product-media";

const copy={
  es:{menu:"Carta",close:"Cerrar",share:"Compartir",info:"Restaurante",soundOn:"Activar sonido",soundOff:"Silenciar",website:"Visitar web",categories:"Categorías",featured:"Destacado"},
  en:{menu:"Menu",close:"Close",share:"Share",info:"Restaurant",soundOn:"Turn sound on",soundOff:"Mute",website:"Visit website",categories:"Categories",featured:"Featured"},
} as const;

function sendAnalytics(payload:AnalyticsEvent){
  const body=JSON.stringify(payload);
  if(typeof navigator.sendBeacon==="function"&&navigator.sendBeacon("/api/analytics",new Blob([body],{type:"application/json"})))return;
  void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>undefined);
}

export function VideoMenu({restaurant,products}:{restaurant:Restaurant;products:Product[]}){
  const videoRefs=useRef<(HTMLVideoElement|null)[]>([]);
  const sectionRefs=useRef<(HTMLElement|null)[]>([]);
  const trackedMenu=useRef(false);
  const seenProducts=useRef(new Set<string>());
  const playingIndex=useRef<number|null>(null);
  const[muted,setMuted]=useState(true);
  const[panel,setPanel]=useState<"menu"|"info"|null>(null);
  const[active,setActive]=useState(0);
  const[reducedMotion,setReducedMotion]=useState(false);
  const[playbackBlocked,setPlaybackBlocked]=useState<Set<number>>(()=>new Set());
  const[language,setLanguage]=useState<"es"|"en">(restaurant.locale.startsWith("en")?"en":"es");
  const text=copy[language];
  const template=resolveMenuTemplate(restaurant.menu_template,restaurant.subscription_status==="active");
  const framed=template.layout==="framed";
  const card=template.layout!=="fullscreen";
  const colors=template.colors;
  const themeStyle={"--theme-bg":colors.background,"--theme-panel":colors.panel,"--theme-nav":colors.nav,"--theme-accent":colors.accent,"--theme-accent-2":colors.accent2,"--theme-frame":colors.frame} as CSSProperties;
  const categories=[...new Map(products.map(product=>[translatedField(product.categories??{},"name",language,product.categories?.name??text.menu),product])).entries()];
  const restaurantDescription=translatedField(restaurant,"description",language,restaurant.description);

  useEffect(()=>{
    const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>.55)setActive(Number((entry.target as HTMLElement).dataset.index??0))}),{threshold:[.55]});
    sectionRefs.current.forEach(section=>section&&sectionObserver.observe(section));
    const motionPreference=matchMedia("(prefers-reduced-motion: reduce)");
    const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const video=entry.target as HTMLVideoElement;const index=Number(video.dataset.videoIndex);if(entry.isIntersecting&&entry.intersectionRatio>.7){if(motionPreference.matches){video.pause();video.currentTime=0;return}if(playingIndex.current===index)return;videoRefs.current.forEach(other=>{if(other&&other!==video){other.pause();other.currentTime=0}});video.currentTime=0;playingIndex.current=index;void video.play().then(()=>setPlaybackBlocked(current=>{if(!current.has(index))return current;const next=new Set(current);next.delete(index);return next})).catch(()=>{if(playingIndex.current===index)setPlaybackBlocked(current=>new Set(current).add(index))})}else{video.pause();video.currentTime=0;if(playingIndex.current===index)playingIndex.current=null}}),{threshold:[.7]});
    const observedVideos=videoRefs.current.filter((video):video is HTMLVideoElement=>Boolean(video));
    observedVideos.forEach(video=>videoObserver.observe(video));
    return()=>{sectionObserver.disconnect();videoObserver.disconnect();playingIndex.current=null;observedVideos.forEach(video=>{video.pause();video.currentTime=0})};
  },[products]);

  useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>{setReducedMotion(query.matches);if(query.matches){playingIndex.current=null;videoRefs.current.forEach(video=>{if(video){video.pause();video.currentTime=0}})}};update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update)},[]);

  useEffect(()=>{if(!panel)return;const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setPanel(null)};addEventListener("keydown",closeOnEscape);return()=>removeEventListener("keydown",closeOnEscape)},[panel]);

  useEffect(()=>{if(trackedMenu.current)return;trackedMenu.current=true;sendAnalytics({restaurantId:restaurant.id,event:"menu_view",locale:language})},[restaurant.id,language]);
  useEffect(()=>{const product=products[active];if(!product||seenProducts.current.has(product.id))return;seenProducts.current.add(product.id);sendAnalytics({restaurantId:restaurant.id,productId:product.id,event:"product_view",locale:language})},[active,language,products,restaurant.id]);
  useEffect(()=>{document.documentElement.lang=language;return()=>{document.documentElement.lang="es"}},[language]);

  const share=async()=>{let completed=false;try{await navigator.share({title:restaurant.name,url:location.href});completed=true}catch{try{await navigator.clipboard.writeText(location.href);completed=true}catch{completed=false}}if(completed)sendAnalytics({restaurantId:restaurant.id,event:"share",locale:language})};
  const go=(id:string)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});setPanel(null)};
  const back=()=>history.length>1?history.back():location.assign("/");
  const manualPlaybackStarted=(index:number)=>{playingIndex.current=index;setPlaybackBlocked(current=>{if(!current.has(index))return current;const next=new Set(current);next.delete(index);return next})};

  return <main aria-label={`Carta de ${restaurant.name}`} data-template={template.key} style={themeStyle} className="public-menu relative h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth bg-[var(--theme-bg)] text-white md:mx-auto md:max-w-[430px] md:border-x md:border-white/10 md:shadow-2xl">
    <h1 className="sr-only">{restaurant.name}: carta en vídeo</h1>
    <header style={{background:`linear-gradient(to bottom,${colors.background}f2,${colors.background}a8,transparent)`}} className="pointer-events-none fixed left-0 right-0 top-0 z-30 mx-auto flex max-w-[430px] items-center justify-between px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <button aria-label="Volver" onClick={back} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md"><ArrowLeft size={20}/></button>
      <div className="flex min-w-0 flex-1 justify-center px-3">{restaurant.logo_url?<span role="img" aria-label={`Logo de ${restaurant.name}`} className="h-12 w-32 bg-contain bg-center bg-no-repeat drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]" style={{backgroundImage:`url(${restaurant.logo_url})`}}/>:<strong className="truncate text-lg tracking-tight drop-shadow-lg">{restaurant.name}</strong>}</div>
      {restaurant.language_switcher_enabled?<button aria-label={language==="es"?"Cambiar a inglés":"Switch to Spanish"} onClick={()=>setLanguage(value=>value==="es"?"en":"es")} className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 text-xs font-bold backdrop-blur-md"><Languages size={17}/>{language.toUpperCase()}</button>:<span className="h-10 w-10"/>}
    </header>

    <div aria-hidden="true" className="pointer-events-none fixed right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 md:right-[calc((100vw-430px)/2+12px)]">{products.map((product,index)=><span key={product.id} style={{background:index===active?colors.accent:"rgba(255,255,255,.4)"}} className={`w-1 rounded-full transition-all ${active===index?"h-6":"h-1"}`}/>)}</div>

    {panel&&<div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/65 p-3 backdrop-blur-sm" onClick={()=>setPanel(null)}>
      <aside aria-label={panel==="menu"?text.categories:text.info} style={{background:colors.panel,borderColor:colors.frame}} className="w-full rounded-[28px] border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl" onClick={event=>event.stopPropagation()}>
        <div className="flex items-center justify-between"><div><p style={{color:colors.accent}} className="text-xs font-bold uppercase tracking-[.2em]">{restaurant.name}</p><h2 className="mt-1 text-2xl font-semibold">{panel==="menu"?text.categories:text.info}</h2></div><button aria-label={text.close} onClick={()=>setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X size={20}/></button></div>
        {panel==="menu"?<nav className="mt-5 grid gap-2">{categories.map(([name,product])=><button key={name} onClick={()=>go(`product-${product.id}`)} className="flex items-center rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left transition hover:bg-white/10"><span className="font-medium">{name}</span></button>)}</nav>:<div className="mt-5 space-y-4 text-sm leading-relaxed text-white/70">{restaurantDescription&&<p>{restaurantDescription}</p>}{restaurant.address&&<p className="flex gap-3"><MapPin style={{color:colors.accent}} className="mt-0.5 shrink-0" size={18}/><span>{restaurant.address}</span></p>}{restaurant.phone&&<a className="flex gap-3 text-white" href={`tel:${restaurant.phone}`} onClick={()=>sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}><Phone style={{color:colors.accent}} className="shrink-0" size={18}/>{restaurant.phone}</a>}<div className="flex flex-wrap gap-2">{restaurant.instagram_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.instagram_url} onClick={()=>sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}>Instagram</a>}{restaurant.website_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.website_url} onClick={()=>sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}>{text.website}</a>}</div></div>}
      </aside>
    </div>}

    <div>{products.map((product,index)=><section ref={element=>{sectionRefs.current[index]=element}} data-index={index} id={`product-${product.id}`} key={product.id} className="relative isolate flex h-dvh snap-start snap-always items-end overflow-hidden bg-[var(--theme-bg)] px-4 pb-28 pt-28">
      <div style={{borderColor:colors.frame}} className={`absolute z-0 overflow-hidden bg-[#22221f] ${framed?"inset-3 bottom-24 rounded-[32px] border shadow-2xl":"inset-0"}`}><ProductMedia index={index} name={product.name} src={product.video_url} poster={product.image_url} muted={muted} preload={index<=active+1?"metadata":"none"} active={index===active} reducedMotion={reducedMotion} playbackBlocked={playbackBlocked.has(index)} setVideoRef={element=>{videoRefs.current[index]=element}} onManualPlay={()=>manualPlaybackStarted(index)}/></div>
      <div className={`absolute z-[1] ${framed?"inset-3 bottom-24 rounded-[32px]":"inset-0"}`} style={{background:`linear-gradient(180deg,${colors.background}66 0%,transparent 32%,transparent 45%,${colors.background}f2 100%)`}}/>
      <ThemeVectors motif={template.motif} accent={colors.accent} accent2={colors.accent2} className="absolute inset-0 z-[2] h-full w-full"/>
      <div data-product-details style={card?{background:`${colors.panel}d9`,borderColor:colors.frame}:undefined} className={`relative z-10 w-full max-h-[34dvh] overflow-hidden text-shadow-lg ${card?"mb-1 rounded-[22px] border p-4 shadow-2xl backdrop-blur-xl":""}`}>
        <div className="mb-2 flex min-w-0 items-center gap-2"><span style={{color:colors.accent,borderColor:colors.frame,background:`${colors.panel}b8`}} className="max-w-[65%] truncate rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.15em] backdrop-blur-md">{translatedField(product.categories??{},"name",language,product.categories?.name)}</span>{product.is_featured&&<span className="truncate text-[11px] font-medium text-white/70">★ {text.featured}</span>}</div>
        <h2 className="line-clamp-2 max-w-[340px] text-[clamp(1.55rem,7vw,2.25rem)] font-semibold leading-[1.02] tracking-[-.035em]">{translatedField(product,"name",language,product.name)}</h2>
        {translatedField(product,"description",language,product.description)&&<p className="mt-2 line-clamp-2 max-w-[350px] text-[13px] leading-[1.45] text-white/75">{translatedField(product,"description",language,product.description)}</p>}
        <div className="mt-3"><strong style={{color:colors.accent}} className="text-xl font-semibold tabular-nums">{new Intl.NumberFormat(language==="es"?"es-ES":"en-US",{style:"currency",currency:restaurant.currency}).format(product.price_cents/100)}</strong></div>
      </div>
    </section>)}</div>

    <nav aria-label="Controles de la carta" style={{background:`${colors.nav}ed`,borderColor:colors.frame}} className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-[398px] -translate-x-1/2 items-center justify-around rounded-2xl border px-2 py-2 shadow-2xl backdrop-blur-xl">
      <button aria-label={text.menu} onClick={()=>setPanel("menu")} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/80"><List size={20}/>{text.menu}</button>
      <button aria-label={muted?text.soundOn:text.soundOff} onClick={()=>setMuted(value=>!value)} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/80">{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}Audio</button>
      <button aria-label={text.info} onClick={()=>setPanel("info")} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/80"><Info size={20}/>{text.info}</button>
      <button aria-label={text.share} onClick={share} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] text-white/80"><Share2 size={20}/>{text.share}</button>
    </nav>
  </main>;
}
