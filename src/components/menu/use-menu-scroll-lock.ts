"use client";
import {useEffect} from "react";

export function useMenuScrollLock(){
  useEffect(()=>{
    const root=document.documentElement,body=document.body;
    root.classList.add("public-menu-scroll-lock");body.classList.add("public-menu-scroll-lock");
    let previousY:number|null=null;
    const start=(event:TouchEvent)=>{previousY=event.touches.length===1?event.touches[0].clientY:null};
    const move=(event:TouchEvent)=>{
      if(previousY===null||event.touches.length!==1)return;
      const y=event.touches[0].clientY,delta=y-previousY;previousY=y;
      if(!delta)return;
      let element=event.target instanceof Element?event.target:null;
      while(element&&element!==root&&element!==body){
        const style=getComputedStyle(element);
        if(/auto|scroll/.test(style.overflowY)&&element.scrollHeight>element.clientHeight+1){
          if(delta>0?element.scrollTop>0:element.scrollTop+element.clientHeight<element.scrollHeight-1)return;
        }
        element=element.parentElement;
      }
      if(event.cancelable)event.preventDefault();
    };
    const end=()=>{previousY=null};
    document.addEventListener("touchstart",start,{passive:true,capture:true});
    document.addEventListener("touchmove",move,{passive:false,capture:true});
    document.addEventListener("touchend",end,{passive:true,capture:true});
    document.addEventListener("touchcancel",end,{passive:true,capture:true});
    return()=>{
      root.classList.remove("public-menu-scroll-lock");body.classList.remove("public-menu-scroll-lock");
      document.removeEventListener("touchstart",start,true);document.removeEventListener("touchmove",move,true);
      document.removeEventListener("touchend",end,true);document.removeEventListener("touchcancel",end,true);
    };
  },[]);
}
