"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {ImageOff,LoaderCircle,Play,RefreshCcw} from "lucide-react";

type Props={index:number;name:string;src:string|null;poster:string|null;muted:boolean;preload:"none"|"metadata"|"auto";active:boolean;hydrated:boolean;reducedMotion:boolean;playbackBlocked:boolean;setVideoRef:(element:HTMLVideoElement|null)=>void;onPlaybackStarted:(index:number)=>void};

export function ProductMedia({index,name,src,poster,muted,preload,active,hydrated,reducedMotion,playbackBlocked,setVideoRef,onPlaybackStarted}:Props){
  const localRef=useRef<HTMLVideoElement|null>(null);
  const[status,setStatus]=useState<"loading"|"ready"|"error">(src?"loading":"ready");
  const[manuallyPlaying,setManuallyPlaying]=useState(false);
  const[autoBlocked,setAutoBlocked]=useState(false);

  useEffect(()=>{setStatus(src?"loading":"ready");setAutoBlocked(false)},[src]);
  useEffect(()=>{if(!active)setManuallyPlaying(false)},[active]);

  const assign=(element:HTMLVideoElement|null)=>{
    localRef.current=element;
    if(element){element.muted=muted;element.defaultMuted=muted}
    setVideoRef(element);
  };
  const attemptPlayback=useCallback(()=>{
    const video=localRef.current;
    if(!video||!active||reducedMotion)return;
    video.muted=muted;
    void video.play().then(()=>{setAutoBlocked(false);onPlaybackStarted(index)}).catch(()=>setAutoBlocked(true));
  },[active,index,muted,onPlaybackStarted,reducedMotion]);
  useEffect(()=>{if(active&&status==="ready"&&!reducedMotion)attemptPlayback()},[active,attemptPlayback,reducedMotion,status]);
  const retry=()=>{const video=localRef.current;if(!video)return;setStatus("loading");setAutoBlocked(false);video.load()};
  const manualPlay=()=>{const video=localRef.current;if(!video)return;video.currentTime=0;video.muted=muted;void video.play().then(()=>{setManuallyPlaying(true);setAutoBlocked(false);onPlaybackStarted(index)}).catch(()=>setAutoBlocked(true))};
  const fallbackStyle={backgroundImage:poster?`linear-gradient(rgba(6,8,18,.12),rgba(6,8,18,.45)),url(${poster})`:"radial-gradient(circle at 65% 25%,#4c1d95,#111827 55%,#030712)"};

  return <div className="relative h-full w-full overflow-hidden bg-slate-950">
    <div aria-hidden="true" style={fallbackStyle} className="absolute inset-0 bg-cover bg-center"/>
    {src&&hydrated&&<video
      data-video-index={index}
      ref={assign}
      src={src}
      poster={poster??undefined}
      autoPlay={active&&!reducedMotion}
      muted={muted}
      loop
      playsInline
      preload={preload}
      onLoadStart={()=>setStatus("loading")}
      onLoadedMetadata={attemptPlayback}
      onCanPlay={()=>{setStatus("ready");attemptPlayback()}}
      onError={()=>setStatus("error")}
      className={`relative h-full w-full object-cover transition-opacity duration-300 ${status==="ready"?"opacity-100":"opacity-0"}`}
    />}
    {src&&hydrated&&status==="loading"&&<div role="status" aria-label={`Cargando vídeo de ${name}`} className="absolute inset-0 grid place-items-center bg-black/15"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 backdrop-blur-md"><LoaderCircle className="animate-spin" size={20}/></span></div>}
    {src&&hydrated&&status==="error"&&<div className="absolute inset-0 grid place-items-center bg-black/45 p-6 text-center backdrop-blur-[2px]"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ImageOff size={22}/></span><p className="mt-3 text-sm font-semibold">El vídeo no está disponible</p><p className="mt-1 text-xs text-white/60">Mostramos la portada para no interrumpir la carta.</p><button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold"><RefreshCcw size={14}/>Reintentar</button></div></div>}
    {src&&hydrated&&active&&status==="ready"&&((reducedMotion&&!manuallyPlaying)||playbackBlocked||autoBlocked)&&<button type="button" onClick={manualPlay} aria-label={`Reproducir vídeo de ${name}`} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 shadow-xl backdrop-blur-md"><Play className="ml-1" fill="currentColor" size={23}/></button>}
  </div>;
}
