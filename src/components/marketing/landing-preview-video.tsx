"use client";

import {useEffect,useRef} from "react";

const BURGER_VIDEO="https://res.cloudinary.com/det6jfwzx/video/upload/v1783700256/Generame_un_video_de_una_hambu_oo9gur.mp4";
const BURGER_POSTER="https://res.cloudinary.com/det6jfwzx/video/upload/so_0.5,f_jpg,q_auto/v1783700256/Generame_un_video_de_una_hambu_oo9gur.jpg";

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
