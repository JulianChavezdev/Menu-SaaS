"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {ImageOff,LoaderCircle,Play,RefreshCcw} from "lucide-react";

type Props={index:number;name:string;src:string|null;poster:string|null;muted:boolean;preload:"none"|"metadata"|"auto";active:boolean;hydrated:boolean;reducedMotion:boolean;playbackBlocked:boolean;setVideoRef:(element:HTMLVideoElement|null)=>void;onPlaybackStarted:(index:number)=>void};

export function ProductMedia({index,name,src,poster,muted,preload,active,hydrated,reducedMotion,playbackBlocked,setVideoRef,onPlaybackStarted}:Props){
  const localRef=useRef<HTMLVideoElement|null>(null);
  const bufferingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const[status,setStatus]=useState<"loading"|"ready"|"error">(src?"loading":"ready");
  const[manuallyPlaying,setManuallyPlaying]=useState(false);
  const[autoBlocked,setAutoBlocked]=useState(false);
  const[buffering,setBuffering]=useState(false);
  const[slow,setSlow]=useState(false);

  useEffect(()=>{setStatus(src?"loading":"ready");setAutoBlocked(false);setBuffering(false);setSlow(false);return()=>{if(bufferingTimer.current)clearTimeout(bufferingTimer.current)}},[src]);
  useEffect(()=>{if(!active){setManuallyPlaying(false);setBuffering(false);setSlow(false)}},[active]);
  useEffect(()=>{
    const video=localRef.current;
    if(!hydrated||!src||!video)return;
    video.preload="auto";
    if(video.networkState===HTMLMediaElement.NETWORK_EMPTY)video.load();
  },[hydrated,src]);

  const assign=(element:HTMLVideoElement|null)=>{
    localRef.current=element;
    if(element){element.muted=muted;element.defaultMuted=muted}
    setVideoRef(element);
  };
  const attemptPlayback=useCallback(()=>{
    const video=localRef.current;
    if(!video||!active||reducedMotion)return;
    video.muted=muted;
    void video.play().then(()=>{setAutoBlocked(false);setBuffering(false);setSlow(false);onPlaybackStarted(index)}).catch(()=>setAutoBlocked(true));
  },[active,index,muted,onPlaybackStarted,reducedMotion]);
  useEffect(()=>{
    if(!active||!hydrated||!src||reducedMotion)return;
    attemptPlayback();
    const retryShort=setTimeout(attemptPlayback,700);
    const retryLong=setTimeout(attemptPlayback,2000);
    const revealRecovery=setTimeout(()=>{const video=localRef.current;if(video&&(video.paused||video.readyState<HTMLMediaElement.HAVE_FUTURE_DATA))setSlow(true)},4000);
    return()=>{clearTimeout(retryShort);clearTimeout(retryLong);clearTimeout(revealRecovery)};
  },[active,attemptPlayback,hydrated,reducedMotion,src]);
  const retry=()=>{const video=localRef.current;if(!video)return;setStatus("loading");setBuffering(true);setSlow(false);setAutoBlocked(false);video.load();attemptPlayback()};
  const manualPlay=()=>{const video=localRef.current;if(!video)return;if(video.readyState>HTMLMediaElement.HAVE_NOTHING)video.currentTime=0;video.muted=muted;void video.play().then(()=>{setManuallyPlaying(true);setAutoBlocked(false);onPlaybackStarted(index)}).catch(()=>setAutoBlocked(true))};
  const markBuffering=()=>{setBuffering(true);if(bufferingTimer.current)clearTimeout(bufferingTimer.current);bufferingTimer.current=setTimeout(()=>{const video=localRef.current;if(active&&video&&(video.paused||video.readyState<HTMLMediaElement.HAVE_FUTURE_DATA))setSlow(true)},2500)};
  const markPlaying=()=>{setStatus("ready");setBuffering(false);setSlow(false);setAutoBlocked(false);onPlaybackStarted(index)};
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
      disablePictureInPicture
      onLoadStart={()=>{setStatus("loading");setBuffering(true)}}
      onLoadedMetadata={attemptPlayback}
      onLoadedData={()=>{setStatus("ready");attemptPlayback()}}
      onCanPlay={()=>{setStatus("ready");attemptPlayback()}}
      onPlaying={markPlaying}
      onWaiting={markBuffering}
      onStalled={markBuffering}
      onError={()=>setStatus("error")}
      className={`relative h-full w-full object-cover transition-opacity duration-300 ${status==="ready"?"opacity-100":"opacity-0"}`}
    />}
    {src&&hydrated&&(status==="loading"||buffering)&&!slow&&<div role="status" aria-label={`Cargando vídeo de ${name}`} className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15"><span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 backdrop-blur-md"><LoaderCircle className="animate-spin" size={20}/></span></div>}
    {src&&hydrated&&slow&&status!=="error"&&<button type="button" onClick={retry} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md"><RefreshCcw size={15}/>Reanudar vídeo</button>}
    {src&&hydrated&&status==="error"&&<div className="absolute inset-0 grid place-items-center bg-black/45 p-6 text-center backdrop-blur-[2px]"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ImageOff size={22}/></span><p className="mt-3 text-sm font-semibold">El vídeo no está disponible</p><p className="mt-1 text-xs text-white/60">Mostramos la portada para no interrumpir la carta.</p><button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold"><RefreshCcw size={14}/>Reintentar</button></div></div>}
    {src&&hydrated&&active&&status==="ready"&&((reducedMotion&&!manuallyPlaying)||playbackBlocked||autoBlocked)&&<button type="button" onClick={manualPlay} aria-label={`Reproducir vídeo de ${name}`} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 shadow-xl backdrop-blur-md"><Play className="ml-1" fill="currentColor" size={23}/></button>}
  </div>;
}
