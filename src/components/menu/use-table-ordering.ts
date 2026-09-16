"use client";
import {useEffect,useState} from "react";
import {fetchTableContext} from "@/lib/table-context-client";
import type {TableOrderingContext} from "./table-order-checkout";

// Runs for the whole menu, including while the cart is closed or ordering is disabled.
export function useTableOrdering(initial:TableOrderingContext|null){
  const [context,setContext]=useState(initial?{...initial,active:false}:null);
  const code=initial?.tableCode;const mode=initial?.mode;const name=initial?.tableName;
  useEffect(()=>{
    if(!code||mode==="pickup")return;
    let disposed=false;let controller:AbortController|undefined;
    async function refresh(){
      controller?.abort();controller=new AbortController();const signal=controller.signal;
      try{const latest=await fetchTableContext(code!,signal);if(!disposed&&!signal.aborted)setContext({tableCode:code!,tableName:name!,...latest})}
      catch{if(!disposed&&!signal.aborted)setContext(current=>current?{...current,active:false}:null)}
    }
    const visible=()=>{if(document.visibilityState==="visible")void refresh()};
    const channel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("menuly:order-settings"):null;
    if(channel)channel.onmessage=()=>void refresh();
    void refresh();const timer=setInterval(visible,4000);
    window.addEventListener("focus",visible);window.addEventListener("pageshow",visible);document.addEventListener("visibilitychange",visible);
    return()=>{disposed=true;controller?.abort();clearInterval(timer);channel?.close();window.removeEventListener("focus",visible);window.removeEventListener("pageshow",visible);document.removeEventListener("visibilitychange",visible)};
  },[code,mode,name]);
  if(!initial)return null;
  if(mode==="pickup")return initial;
  return context?.tableCode===code?{...initial,...context}:{...initial,active:false};
}
