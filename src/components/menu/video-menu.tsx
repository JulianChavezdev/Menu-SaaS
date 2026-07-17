"use client";

import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import {ArrowLeft,Check,ChevronDown,Info,Languages,List,MapPin,Minus,Phone,Plus,Share2,ShoppingBag,Trash2,TriangleAlert,Volume2,VolumeX,X} from "lucide-react";
import type {Product,Restaurant} from "@/lib/types";
import {resolveMenuTemplate} from "@/lib/menu-templates";
import {translatedField} from "@/lib/translations";
import {ThemeVectors} from "@/components/menu/theme-vectors";
import type {AnalyticsEvent} from "@/lib/analytics";
import {ProductMedia} from "@/components/menu/product-media";
import {addCartItem,changeCartQuantity,parseCart,updateCartNote,type CartLine} from "@/lib/menu-cart";
import {allergenLabel,type AllergenCode} from "@/lib/allergens";

const copy={
  es:{menu:"Carta",close:"Cerrar",share:"Compartir",info:"Restaurante",soundOn:"Activar sonido",soundOff:"Silenciar",website:"Visitar web",categories:"Categorías",featured:"Destacado",description:"Descripción",allergens:"Alérgenos",allergenNotice:"Si tienes una alergia, confirma siempre la información con el personal.",listHint:"Toca un plato para verlo en vídeo.",add:"Añadir",cart:"Carrito",emptyCart:"Tu carrito está vacío",total:"Total",note:"Observaciones",notePlaceholder:"Añade o quita ingredientes",remove:"Eliminar",saved:"Guardado en este dispositivo. No se envía a cocina."},
  en:{menu:"Menu",close:"Close",share:"Share",info:"Restaurant",soundOn:"Turn sound on",soundOff:"Mute",website:"Visit website",categories:"Categories",featured:"Featured",description:"Description",allergens:"Allergens",allergenNotice:"If you have an allergy, always confirm the information with staff.",listHint:"Tap a dish to view its video.",add:"Add",cart:"Cart",emptyCart:"Your cart is empty",total:"Total",note:"Notes",notePlaceholder:"Add or remove ingredients",remove:"Remove",saved:"Saved on this device. It is not sent to the kitchen."},
} as const;

function sendAnalytics(payload:AnalyticsEvent){
  const body=JSON.stringify(payload);
  if(typeof navigator.sendBeacon==="function"&&navigator.sendBeacon("/api/analytics",new Blob([body],{type:"application/json"})))return;
  void fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>undefined);
}

function revealExpandedDetails(details:HTMLDetailsElement){
  if(!details.open)return;
  requestAnimationFrame(()=>{const container=details.closest<HTMLElement>("[data-product-details]");if(!container)return;const bottom=details.offsetTop+details.offsetHeight;const visibleBottom=container.scrollTop+container.clientHeight;if(bottom>visibleBottom)container.scrollTo({top:bottom-container.clientHeight+8,behavior:"smooth"})});
}

export function VideoMenu({restaurant,products,analyticsEnabled=true,introEnabled=true}:{restaurant:Restaurant;products:Product[];analyticsEnabled?:boolean;introEnabled?:boolean}){
  const videoRefs=useRef<(HTMLVideoElement|null)[]>([]);
  const sectionRefs=useRef<(HTMLElement|null)[]>([]);
  const feedRef=useRef<HTMLElement|null>(null);
  const categoryNavRef=useRef<HTMLElement|null>(null);
  const categoryButtonRefs=useRef(new Map<string,HTMLButtonElement>());
  const trackedMenu=useRef(false);
  const seenProducts=useRef(new Set<string>());
  const playedVideos=useRef(new Set<string>());
  const playingIndex=useRef<number|null>(null);
  const catalogFeedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const[muted,setMuted]=useState(true);
  const[panel,setPanel]=useState<"menu"|"info"|"cart"|null>(null);
  const[cart,setCart]=useState<CartLine[]>([]);
  const[cartReady,setCartReady]=useState(false);
  const[catalogAdded,setCatalogAdded]=useState<string|null>(null);
  const[hydrated,setHydrated]=useState(false);
  const[introVisible,setIntroVisible]=useState(Boolean(restaurant.logo_url)&&introEnabled);
  const[active,setActive]=useState(0);
  const[reducedMotion,setReducedMotion]=useState(false);
  const[playbackBlocked,setPlaybackBlocked]=useState<Set<number>>(()=>new Set());
  const[language,setLanguage]=useState<"es"|"en">(restaurant.locale.startsWith("en")?"en":"es");
  const text=copy[language];
  const template=resolveMenuTemplate(restaurant.menu_template,restaurant.subscription_status==="active");
  const framed=template.layout==="framed";
  const colors=template.colors;
  const themeStyle={"--theme-bg":colors.background,"--theme-panel":colors.panel,"--theme-nav":colors.nav,"--theme-accent":colors.accent,"--theme-accent-2":colors.accent2,"--theme-frame":colors.frame} as CSSProperties;
  const categoryGroups=[...products.reduce((groups,product)=>{const name=translatedField(product.categories??{},"name",language,product.categories?.name??text.menu);const current=groups.get(product.category_id);if(current)current.products.push(product);else groups.set(product.category_id,{id:product.category_id,name,products:[product]});return groups},new Map<string,{id:string;name:string;products:Product[]}>()).values()];
  const activeCategory=products[active]?.category_id;
  const restaurantDescription=translatedField(restaurant,"description",language,restaurant.description);
  const cartKey=`carta-video:cart:${restaurant.id}`;
  const currency=new Intl.NumberFormat(language==="es"?"es-ES":"en-US",{style:"currency",currency:restaurant.currency});
  const cartDetails=cart.flatMap(line=>{const product=products.find(item=>item.id===line.productId);return product?[{...line,product}]:[]});
  const cartQuantity=cartDetails.reduce((total,line)=>total+line.quantity,0);
  const cartTotal=cartDetails.reduce((total,line)=>total+(line.product.price_cents*line.quantity),0);
  const trackVideoPlay=useCallback((index:number)=>{const product=products[index];if(!analyticsEnabled||!product?.video_url||playedVideos.current.has(product.id))return;playedVideos.current.add(product.id);sendAnalytics({restaurantId:restaurant.id,productId:product.id,event:"video_play",locale:language})},[analyticsEnabled,language,products,restaurant.id]);
  const playbackStarted=useCallback((index:number)=>{playingIndex.current=index;trackVideoPlay(index);setPlaybackBlocked(current=>{if(!current.has(index))return current;const next=new Set(current);next.delete(index);return next})},[trackVideoPlay]);
  const startVideo=useCallback((video:HTMLVideoElement,index:number)=>{video.muted=muted;const failed=()=>{if(playingIndex.current===index)playingIndex.current=null;setPlaybackBlocked(current=>new Set(current).add(index))};void video.play().then(()=>playbackStarted(index)).catch(()=>{if(video.muted){failed();return}video.muted=true;setMuted(true);void video.play().then(()=>playbackStarted(index)).catch(failed)})},[muted,playbackStarted]);

  useEffect(()=>{
    const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>.35)setActive(Number((entry.target as HTMLElement).dataset.index??0))}),{root:feedRef.current,threshold:[.35]});
    sectionRefs.current.forEach(section=>section&&sectionObserver.observe(section));
    const motionPreference=matchMedia("(prefers-reduced-motion: reduce)");
    const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const video=entry.target as HTMLVideoElement;const index=Number(video.dataset.videoIndex);
      if(introVisible){video.pause();video.currentTime=0;return}
      if(entry.isIntersecting&&entry.intersectionRatio>.45){
        if(motionPreference.matches){video.pause();video.currentTime=0;return}
        if(playingIndex.current===index&&!video.paused&&!video.ended)return;
        videoRefs.current.forEach(other=>{if(other&&other!==video){other.pause();other.currentTime=0}});video.currentTime=0;playingIndex.current=index;
        startVideo(video,index);
      }else{video.pause();video.currentTime=0;if(playingIndex.current===index)playingIndex.current=null}
    }),{threshold:[.45]});
    const observedVideos=videoRefs.current.filter((video):video is HTMLVideoElement=>Boolean(video));
    observedVideos.forEach(video=>videoObserver.observe(video));
    return()=>{sectionObserver.disconnect();videoObserver.disconnect();playingIndex.current=null;observedVideos.forEach(video=>{video.pause();video.currentTime=0})};
  },[active,introVisible,products,startVideo]);

  useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>{setReducedMotion(query.matches);if(query.matches){playingIndex.current=null;videoRefs.current.forEach(video=>{if(video){video.pause();video.currentTime=0}})}};update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update)},[]);
  useEffect(()=>{if(!panel)return;const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setPanel(null)};addEventListener("keydown",closeOnEscape);return()=>removeEventListener("keydown",closeOnEscape)},[panel]);
  useEffect(()=>{if(!analyticsEnabled||trackedMenu.current)return;trackedMenu.current=true;sendAnalytics({restaurantId:restaurant.id,event:"menu_view",locale:language})},[analyticsEnabled,restaurant.id,language]);
  useEffect(()=>{if(!analyticsEnabled)return;const product=products[active];if(!product||seenProducts.current.has(product.id))return;seenProducts.current.add(product.id);sendAnalytics({restaurantId:restaurant.id,productId:product.id,event:"product_view",locale:language})},[active,analyticsEnabled,language,products,restaurant.id]);
  useEffect(()=>{document.documentElement.lang=language;return()=>{document.documentElement.lang="es"}},[language]);
  useEffect(()=>{setCart(parseCart(localStorage.getItem(cartKey)));setCartReady(true)},[cartKey]);
  useEffect(()=>{if(cartReady)localStorage.setItem(cartKey,JSON.stringify(cart))},[cart,cartKey,cartReady]);
  useEffect(()=>setHydrated(true),[]);
  useEffect(()=>()=>{if(catalogFeedbackTimer.current)clearTimeout(catalogFeedbackTimer.current)},[]);
  useEffect(()=>{const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const timer=setTimeout(()=>setIntroVisible(false),reduced?450:1800);return()=>clearTimeout(timer)},[]);
  useEffect(()=>{const nav=categoryNavRef.current;const button=activeCategory?categoryButtonRefs.current.get(activeCategory):null;if(!nav||!button)return;nav.scrollTo({left:button.offsetLeft-(nav.clientWidth-button.offsetWidth)/2,behavior:"smooth"})},[activeCategory]);

  const share=async()=>{let completed=false;try{await navigator.share({title:restaurant.name,url:location.href});completed=true}catch{try{await navigator.clipboard.writeText(location.href);completed=true}catch{completed=false}}if(completed&&analyticsEnabled)sendAnalytics({restaurantId:restaurant.id,event:"share",locale:language})};
  const go=(id:string,direct=false)=>{const target=document.getElementById(id);if(direct&&target&&feedRef.current)feedRef.current.scrollTo({top:target.offsetTop,behavior:"instant"});else target?.scrollIntoView({behavior:"smooth",block:"start"});setPanel(null)};
  const back=()=>history.length>1?history.back():location.assign("/");
  const resumeActiveVideo=useCallback(()=>{if(introVisible)return;const feed=feedRef.current;const visibleIndex=feed?Math.max(0,Math.min(products.length-1,Math.round(feed.scrollTop/feed.clientHeight))):active;const video=videoRefs.current[visibleIndex];if(!video||reducedMotion||!products[visibleIndex]?.video_url)return;if(video.error||video.networkState===HTMLMediaElement.NETWORK_NO_SOURCE)video.load();startVideo(video,visibleIndex)},[active,introVisible,products,reducedMotion,startVideo]);
  useEffect(()=>{const resume=()=>{if(document.visibilityState==="visible")resumeActiveVideo()};document.addEventListener("visibilitychange",resume);addEventListener("pageshow",resume);addEventListener("online",resume);return()=>{document.removeEventListener("visibilitychange",resume);removeEventListener("pageshow",resume);removeEventListener("online",resume)}},[resumeActiveVideo]);
  const addProduct=(productId:string)=>{setCart(current=>addCartItem(current,productId));if(analyticsEnabled)sendAnalytics({restaurantId:restaurant.id,productId,event:"cart_add",locale:language})};
  const addFromCatalog=(productId:string)=>{addProduct(productId);setCatalogAdded(productId);if(catalogFeedbackTimer.current)clearTimeout(catalogFeedbackTimer.current);catalogFeedbackTimer.current=setTimeout(()=>setCatalogAdded(null),900)};

  return <main ref={feedRef} onTouchEnd={resumeActiveVideo} aria-label={`Carta de ${restaurant.name}`} data-template={template.key} data-hydrated={hydrated?"true":"false"} style={themeStyle} className="public-menu relative h-screen h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth bg-[var(--theme-bg)] text-white md:mx-auto md:max-w-[402px]">
    <h1 className="sr-only">{restaurant.name}: carta en vídeo</h1>
    {introVisible&&restaurant.logo_url&&<div data-menu-intro role="status" aria-label={`Abriendo la carta de ${restaurant.name}`} style={{background:colors.background}} className="fixed inset-0 z-[70] grid place-items-center overflow-hidden p-8 text-center"><button type="button" aria-label="Abrir carta" onClick={()=>setIntroVisible(false)} className="grid h-44 w-full place-items-center"><span role="img" aria-label={`Logo de ${restaurant.name}`} style={{backgroundImage:`url(${restaurant.logo_url})`}} className="h-full w-full max-w-[280px] bg-contain bg-center bg-no-repeat"/></button></div>}
    <header style={{background:`linear-gradient(to bottom,${colors.background}f2,${colors.background}a8,transparent)`}} className="pointer-events-none fixed left-0 right-0 top-0 z-30 mx-auto flex max-w-[430px] items-center justify-between px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] md:max-w-[402px]">
      <button aria-label="Volver" onClick={back} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md"><ArrowLeft size={20}/></button>
      <div className="flex min-w-0 flex-1 justify-center px-3">{restaurant.logo_url?<span role="img" aria-label={`Logo de ${restaurant.name}`} className="h-12 w-32 bg-contain bg-center bg-no-repeat drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]" style={{backgroundImage:`url(${restaurant.logo_url})`}}/>:<strong className="truncate text-lg tracking-tight drop-shadow-lg">{restaurant.name}</strong>}</div>
      {restaurant.language_switcher_enabled?<button aria-label={language==="es"?"Cambiar a inglés":"Switch to Spanish"} onClick={()=>setLanguage(value=>value==="es"?"en":"es")} className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 text-xs font-bold backdrop-blur-md"><Languages size={17}/>{language.toUpperCase()}</button>:<span className="h-10 w-10"/>}
    </header>

    <div aria-hidden="true" className="pointer-events-none fixed right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 md:right-[calc((100vw-402px)/2+12px)]">{products.map((product,index)=><span key={product.id} style={{background:index===active?colors.accent:"rgba(255,255,255,.4)"}} className={`w-1 rounded-full transition-all ${active===index?"h-6":"h-1"}`}/>)}</div>

    {panel&&<div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/65 p-3 backdrop-blur-sm md:max-w-[402px]" onClick={()=>setPanel(null)}>
      <aside aria-label={panel==="menu"?text.menu:panel==="cart"?text.cart:text.info} style={{background:colors.panel,borderColor:colors.frame}} className="flex max-h-[88vh] max-h-[88dvh] w-full flex-col rounded-xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl" onClick={event=>event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between"><div><p style={{color:colors.accent}} className="text-xs font-bold uppercase tracking-[.2em]">{restaurant.name}</p><h2 className="mt-1 text-2xl font-semibold">{panel==="menu"?text.menu:panel==="cart"?`${text.cart}${cartQuantity?` · ${cartQuantity}`:""}`:text.info}</h2></div><button aria-label={text.close} onClick={()=>setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X size={20}/></button></div>
        {panel==="menu"?<div className="mt-3 min-h-0 overflow-y-auto pr-1"><p className="mb-3 text-[11px] text-white/55">{text.listHint}</p><p aria-live="polite" className="sr-only">{catalogAdded?`${products.find(product=>product.id===catalogAdded)?.name??"Producto"} ${language==="es"?"añadido al carrito":"added to cart"}`:""}</p><div className="space-y-4">{categoryGroups.map(group=><section key={group.id}><h3 style={{color:colors.accent}} className="mb-2 text-[10px] font-bold uppercase tracking-[.14em]">{group.name}</h3><div className="grid grid-cols-2 gap-2">{group.products.map(product=>{const added=catalogAdded===product.id;return <article key={product.id} className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[.04]"><button type="button" aria-label={`Ver ${product.name}`} onClick={()=>go(`product-${product.id}`)} className="relative block aspect-[4/3] w-full overflow-hidden bg-black/30">{product.image_url?<span role="img" aria-label={product.name} style={{backgroundImage:`url(${product.image_url})`}} className="block h-full w-full bg-cover bg-center"/>:<span className="grid h-full place-items-center bg-gradient-to-br from-white/10 to-black/30 text-white/45"><List size={20}/></span>}<span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"/></button><div className="p-2"><button type="button" onClick={()=>go(`product-${product.id}`)} className="line-clamp-1 w-full text-left text-xs font-semibold leading-tight">{translatedField(product,"name",language,product.name)}</button><div className="mt-1.5 flex items-center justify-between gap-2"><strong style={{color:colors.accent}} className="text-xs tabular-nums">{currency.format(product.price_cents/100)}</strong><button type="button" aria-label={added?`${product.name} añadido al carrito`:`${text.add} ${product.name}`} onClick={()=>addFromCatalog(product.id)} style={{background:colors.accent,color:colors.background}} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-200 ${added?"scale-110":"active:scale-90"}`}>{added?<Check size={15} strokeWidth={3}/>:<Plus size={14}/>}</button></div></div></article>})}</div></section>)}</div></div>
        :panel==="cart"?<div className="mt-5 min-h-0 overflow-y-auto pr-1">
          {cartDetails.length===0?<div className="grid place-items-center py-12 text-center text-white/60"><ShoppingBag size={36}/><p className="mt-3">{text.emptyCart}</p></div>:<div className="space-y-4">{cartDetails.map(({product,quantity,note})=><article key={product.id} className="border-b border-white/10 pb-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{translatedField(product,"name",language,product.name)}</h3><p style={{color:colors.accent}} className="mt-1 text-sm font-semibold">{currency.format(product.price_cents/100)}</p></div><div className="flex shrink-0 items-center rounded-full border border-white/15 bg-black/15 p-1"><button aria-label={`Quitar una unidad de ${product.name}`} onClick={()=>setCart(current=>changeCartQuantity(current,product.id,-1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><Minus size={16}/></button><span className="w-7 text-center text-sm font-bold tabular-nums">{quantity}</span><button aria-label={`Añadir una unidad de ${product.name}`} onClick={()=>addProduct(product.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><Plus size={16}/></button></div></div>
            <label className="mt-3 block text-xs font-medium text-white/65">{text.note}<textarea value={note} maxLength={300} onChange={event=>setCart(current=>updateCartNote(current,product.id,event.target.value))} placeholder={text.notePlaceholder} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/></label>
            <button onClick={()=>setCart(current=>current.filter(line=>line.productId!==product.id))} className="mt-2 flex items-center gap-1.5 text-xs text-white/55 hover:text-white"><Trash2 size={14}/>{text.remove}</button>
          </article>)}</div>}
          {cartDetails.length>0&&<div className="sticky bottom-0 mt-4 border-t border-white/15 bg-[var(--theme-panel)] pt-4"><div className="flex items-center justify-between text-lg"><span>{text.total}</span><strong style={{color:colors.accent}}>{currency.format(cartTotal/100)}</strong></div><p className="mt-2 text-xs leading-relaxed text-white/55">{text.saved}</p></div>}
        </div>
        :<div className="mt-5 space-y-4 overflow-y-auto text-sm leading-relaxed text-white/70">{restaurantDescription&&<p>{restaurantDescription}</p>}{restaurant.address&&<p className="flex gap-3"><MapPin style={{color:colors.accent}} className="mt-0.5 shrink-0" size={18}/><span>{restaurant.address}</span></p>}{restaurant.phone&&<a className="flex gap-3 text-white" href={`tel:${restaurant.phone}`} onClick={()=>analyticsEnabled&&sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}><Phone style={{color:colors.accent}} className="shrink-0" size={18}/>{restaurant.phone}</a>}<div className="flex flex-wrap gap-2">{restaurant.instagram_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.instagram_url} onClick={()=>analyticsEnabled&&sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}>Instagram</a>}{restaurant.website_url&&<a className="rounded-full border border-white/15 px-4 py-2" target="_blank" rel="noreferrer" href={restaurant.website_url} onClick={()=>analyticsEnabled&&sendAnalytics({restaurantId:restaurant.id,event:"contact_click",locale:language})}>{text.website}</a>}</div></div>}
      </aside>
    </div>}

    <div>{products.map((product,index)=>{const description=translatedField(product,"description",language,product.description);const allergens=(product.allergens??[]) as AllergenCode[];return <section ref={element=>{sectionRefs.current[index]=element}} data-index={index} id={`product-${product.id}`} key={product.id} className="relative isolate flex h-screen h-dvh snap-start snap-always items-end overflow-hidden bg-[var(--theme-bg)] px-4 pb-[calc(5.5rem+max(.75rem,env(safe-area-inset-bottom)))] pt-24">
      <div style={{borderColor:colors.frame}} className={`absolute z-0 overflow-hidden bg-[#22221f] ${framed?"inset-3 bottom-16 rounded-xl border shadow-2xl":"inset-0"}`}><ProductMedia index={index} name={product.name} src={product.video_url} poster={product.image_url} muted={muted} preload={Math.abs(index-active)<=1?"auto":"metadata"} active={index===active&&!introVisible} hydrated={Math.abs(index-active)<=1} reducedMotion={reducedMotion} playbackBlocked={playbackBlocked.has(index)} setVideoRef={element=>{videoRefs.current[index]=element}} onPlaybackStarted={playbackStarted}/></div>
      <div className={`absolute z-[1] ${framed?"inset-3 bottom-16 rounded-xl":"inset-0"}`} style={{background:`linear-gradient(180deg,${colors.background}66 0%,transparent 32%,transparent 45%,${colors.background}f2 100%)`}}/>
      <ThemeVectors motif={template.motif} accent={colors.accent} accent2={colors.accent2} className="absolute inset-0 z-[2] h-full w-full"/>
      <div data-product-details className="relative z-10 w-full max-h-[calc(100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain pb-0.5 text-shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-h-8 items-center gap-2"><h2 className="line-clamp-1 min-w-0 flex-1 text-[clamp(1.05rem,4.8vw,1.3rem)] font-semibold leading-tight tracking-[-.015em]">{product.is_featured&&<span style={{color:colors.accent}} className="mr-1 text-[9px] align-middle">★</span>}{translatedField(product,"name",language,product.name)}</h2><strong style={{color:colors.accent}} className="shrink-0 text-[14px] font-semibold tabular-nums">{currency.format(product.price_cents/100)}</strong><button aria-label={`${text.add} ${product.name}`} title={text.add} onClick={()=>addProduct(product.id)} style={{background:colors.accent,color:colors.background}} className="grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-lg transition active:scale-90"><Plus size={14}/></button></div>
        {(description||allergens.length>0)&&<details onToggle={event=>revealExpandedDetails(event.currentTarget)} className="group mt-0.5"><summary className="flex cursor-pointer list-none items-center gap-0.5 text-[9px] font-semibold text-white/70">{text.description}<ChevronDown size={11} className="transition-transform group-open:rotate-180"/></summary>{description&&<p className="mt-1 text-[10px] leading-[1.25] text-white/70">{description}</p>}{allergens.length>0&&<div className="mt-1 border-t border-white/10 pt-1"><p className="flex items-center gap-1 text-[9px] font-semibold text-white/65"><TriangleAlert size={10}/>{text.allergens} · {allergens.length}</p><div className="mt-1 flex flex-wrap gap-1">{allergens.map(code=><span key={code} style={{borderColor:colors.frame,background:`${colors.panel}d9`}} className="rounded-full border px-2 py-0.5 text-[9px] font-semibold">{allergenLabel(code,language)}</span>)}</div><p className="mt-1 text-[9px] leading-snug text-white/50">{text.allergenNotice}</p></div>}</details>}
      </div>
    </section>})}</div>

    <nav ref={categoryNavRef} aria-label={text.categories} className="fixed left-1/2 top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)] z-40 flex w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 snap-x snap-mandatory gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-[370px]">
      <span aria-hidden="true" className="w-[calc((100%-1rem)/3)] shrink-0"/>
      {categoryGroups.map(group=>{const selected=activeCategory===group.id;return <button ref={element=>{if(element)categoryButtonRefs.current.set(group.id,element);else categoryButtonRefs.current.delete(group.id)}} key={group.id} type="button" aria-current={selected?"true":undefined} onClick={()=>{const index=products.findIndex(product=>product.id===group.products[0].id);if(index>=0)setActive(index);go(`product-${group.products[0].id}`,true)}} style={selected?{background:colors.accent,color:colors.background,borderColor:colors.accent}:{background:`${colors.nav}ed`,borderColor:colors.frame}} className={`w-[calc((100%-1rem)/3)] shrink-0 snap-center truncate rounded-full border px-2 py-1.5 text-[10px] font-bold shadow-lg backdrop-blur-xl transition-opacity duration-300 ${selected?"opacity-100":"opacity-[.45]"}`}>{group.name}</button>})}
      <span aria-hidden="true" className="w-[calc((100%-1rem)/3)] shrink-0"/>
    </nav>

    <nav aria-label="Controles de la carta" style={{background:`${colors.nav}ed`,borderColor:colors.frame}} className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 grid-cols-5 items-center rounded-xl border px-1 py-1 shadow-2xl backdrop-blur-xl md:max-w-[370px]">
      <button aria-label={text.menu} title={text.menu} onClick={()=>setPanel("menu")} className="grid min-h-9 place-items-center rounded-lg text-white/80"><List size={19}/></button>
      <button aria-label={muted?text.soundOn:text.soundOff} title={muted?text.soundOn:text.soundOff} onClick={()=>setMuted(value=>!value)} className="grid min-h-9 place-items-center rounded-lg text-white/80">{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
      <button aria-label={`${text.cart}: ${cartQuantity}`} title={text.cart} onClick={()=>setPanel("cart")} className="relative grid min-h-9 place-items-center rounded-lg text-white"><ShoppingBag size={20}/>{cartQuantity>0&&<span style={{background:colors.accent,color:colors.background}} className="absolute right-[24%] top-0 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black">{cartQuantity}</span>}</button>
      <button aria-label={text.info} title={text.info} onClick={()=>setPanel("info")} className="grid min-h-9 place-items-center rounded-lg text-white/80"><Info size={19}/></button>
      <button aria-label={text.share} title={text.share} onClick={share} className="grid min-h-9 place-items-center rounded-lg text-white/80"><Share2 size={19}/></button>
    </nav>
  </main>;
}
