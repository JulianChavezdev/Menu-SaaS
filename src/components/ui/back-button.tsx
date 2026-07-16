"use client";

import {ArrowLeft} from "lucide-react";
import {usePathname,useRouter} from "next/navigation";
import {SAAS_BACK_TARGET_KEY,SAAS_HISTORY_KEY} from "@/components/navigation/saas-navigation-tracker";

export function BackButton({fallback="/dashboard"}:{fallback?:string}){
  const router=useRouter();const pathname=usePathname();
  const goBack=()=>{
    let history:string[]=[];
    try{history=JSON.parse(sessionStorage.getItem(SAAS_HISTORY_KEY)??"[]") as string[]}catch{history=[]}
    while(history.at(-1)===pathname)history.pop();
    const target=history.pop()??fallback;
    sessionStorage.setItem(SAAS_HISTORY_KEY,JSON.stringify([...history,target]));
    sessionStorage.setItem(SAAS_BACK_TARGET_KEY,target);
    router.push(target);
  };
  return <button type="button" onClick={goBack} className="saas-back-button focus inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/[.04] px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/10 active:bg-white/15" aria-label="Volver a la sección anterior del panel"><ArrowLeft size={18}/>Volver</button>;
}
