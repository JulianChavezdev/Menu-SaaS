"use client";

import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {RotateCcw} from "lucide-react";
import {transitionDiningOrder} from "@/app/dashboard/ordering/actions";

export function OrderHistoryAction({orderId}:{orderId:string}){
  const router=useRouter();const[pending,start]=useTransition();const[error,setError]=useState("");
  return <div className="mt-3 border-t border-stone-100 pt-3"><button type="button" disabled={pending} onClick={()=>start(async()=>{setError("");try{await transitionDiningOrder(orderId,"pending");router.refresh()}catch(reason){setError(reason instanceof Error?reason.message:"No se pudo reabrir el pedido.")}})} className="inline-flex min-h-10 items-center gap-2 border border-stone-300 px-3 py-2 text-xs font-bold disabled:opacity-50"><RotateCcw size={14}/>{pending?"Reabriendo…":"Reabrir pedido"}</button>{error&&<p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}</div>;
}
