"use client";

import {useEffect,useRef} from "react";

const BURGER_VIDEO="https://videos.pexels.com/video-files/19107070/19107070-hd_1080_1920_30fps.mp4";
const BURGER_POSTER="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80";

export function LandingPreviewVideo(){
  const videoRef=useRef<HTMLVideoElement>(null);

  useEffect(()=>{
    const preference=matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>{
      const video=videoRef.current;
      if(!video)return;
      if(preference.matches){video.pause();video.currentTime=0}
      else void video.play().catch(()=>undefined);
    };
    sync();
    preference.addEventListener("change",sync);
    return()=>preference.removeEventListener("change",sync);
  },[]);

  return <video ref={videoRef} aria-hidden="true" tabIndex={-1} className="absolute inset-0 z-0 h-full w-full object-cover" muted loop playsInline preload="metadata" poster={BURGER_POSTER} src={BURGER_VIDEO}/>;
}
