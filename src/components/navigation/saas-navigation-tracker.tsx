"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export const SAAS_HISTORY_KEY="carta-video:saas-history";
export const SAAS_BACK_TARGET_KEY="carta-video:saas-back-target";

export function SaasNavigationTracker(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!pathname.startsWith("/dashboard")&&!pathname.startsWith("/superadmin"))return;
    const suppressed=sessionStorage.getItem(SAAS_BACK_TARGET_KEY);
    if(suppressed===pathname){sessionStorage.removeItem(SAAS_BACK_TARGET_KEY);return}
    let history:string[]=[];
    try{history=JSON.parse(sessionStorage.getItem(SAAS_HISTORY_KEY)??"[]") as string[]}catch{history=[]}
    if(history.at(-1)!==pathname){
      history.push(pathname);
      sessionStorage.setItem(SAAS_HISTORY_KEY,JSON.stringify(history.slice(-30)));
    }
  },[pathname]);
  return null;
}
