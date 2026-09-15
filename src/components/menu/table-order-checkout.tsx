"use client";
import {useEffect,useRef,useState} from "react";
import {CheckCircle2,ChefHat} from "lucide-react";
import type {CartLine} from "@/lib/menu-cart";
export type TableOrderingContext={tableCode:string;tableName:string;active:boolean;expiresAt:string|null;mode?:"pickup";restaurantId?:string};
type Tracking={number:string;token:string;status:string;paymentStatus?:string};
const terminal=new Set(["delivered","rejected","cancelled"]);
const labels={es:{pending:"Pedido recibido",accepted:"Aceptado",preparing:"En preparación",ready:"Listo para recoger",delivered:"Entregado",rejected:"No aceptado",cancelled:"Cancelado"},en:{pending:"Order received",accepted:"Accepted",preparing:"Preparing",ready:"Ready for pickup",delivered:"Delivered",rejected:"Not accepted",cancelled:"Cancelled"}};
export function TableOrderCheckout({context,lines,language,accent,background,onSent,invalid=false}:{context:TableOrderingContext;lines:CartLine[];language:"es"|"en";accent:string;background:string;onSent:()=>void;invalid?:boolean}){
  const[note,setNote]=useState("");const[sending,setSending]=useState(false);const[sent,setSent]=useState<Tracking|null>(null);const[error,setError]=useState("");const[loaded,setLoaded]=useState(false);
  const sendingRef=useRef(false);const es=language==="es";const pickup=context.mode==="pickup";
  const endpoint=pickup?"/api/public/pickup-orders":"/api/public/orders";
  const storageKey=`menuly:order:${context.tableCode}`;
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(storageKey)??"null");if(stored?.token&&stored?.number)setSent(stored)}catch{}setLoaded(true)},[storageKey]);
  useEffect(()=>{if(!loaded)return;try{if(sent)localStorage.setItem(storageKey,JSON.stringify(sent));else localStorage.removeItem(storageKey)}catch{}},[sent,loaded,storageKey]);
  const trackingToken=sent?.token;const trackingStatus=sent?.status;
  useEffect(()=>{
    if(!trackingToken||!trackingStatus||terminal.has(trackingStatus))return;
    let disposed=false;
    const refresh=async()=>{try{const response=await fetch(`${endpoint}?token=${encodeURIComponent(trackingToken)}${pickup?"":`&table=${encodeURIComponent(context.tableCode)}`}`,{cache:"no-store"});const payload=await response.json();if(!disposed&&response.ok&&payload.order){setSent(current=>current?{...current,...payload.order}:current);setError("")}else if(!disposed)setError(es?"No se pudo actualizar el estado. Estamos reintentando.":"Unable to refresh status. Retrying.")}catch{if(!disposed)setError(es?"Sin conexión. Tu pedido sigue guardado.":"Offline. Your order is saved.")}};
    void refresh();const timer=setInterval(()=>void refresh(),4000);return()=>{disposed=true;clearInterval(timer)};
  },[trackingToken,trackingStatus,endpoint,pickup,context.tableCode,es]);
  async function submit(){
    if(sendingRef.current||!context.active||!lines.length||invalid)return;
    sendingRef.current=true;setSending(true);setError("");
    const fingerprint=JSON.stringify({lines,note});let requestId=crypto.randomUUID();let clientId=crypto.randomUUID();
    try{clientId=localStorage.getItem("menuly:pickup-client")||clientId;localStorage.setItem("menuly:pickup-client",clientId)}catch{}
    try{const previous=JSON.parse(localStorage.getItem(storageKey+":request")??"null");if(previous?.fingerprint===fingerprint)requestId=previous.requestId;localStorage.setItem(storageKey+":request",JSON.stringify({requestId,fingerprint}))}catch{}
    try{const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...pickup?{restaurantId:context.restaurantId}:{tableCode:context.tableCode},requestId,clientId,lines,customerNote:note})});const payload=await response.json();if(!response.ok||!payload.order)throw new Error(payload.error??"No se pudo enviar el pedido");
      const tracking={...payload.order,paymentStatus:"unpaid"};try{localStorage.setItem(storageKey,JSON.stringify(tracking));localStorage.removeItem(storageKey+":request")}catch{}
      setSent(tracking);setNote("");onSent();
    }catch(reason){setError(reason instanceof Error?reason.message:"No se pudo enviar el pedido")}finally{sendingRef.current=false;setSending(false)}
  }
  if(sent){const label=labels[language][sent.status as keyof typeof labels.es]??sent.status;return <section className="mt-4 border border-white/25 bg-black/20 p-4 text-center" aria-label={es?"Seguimiento del pedido":"Order tracking"}><CheckCircle2 className="mx-auto" style={{color:accent}}/><h3 className="mt-2 text-lg font-bold">{es?"Pedido":"Order"} #{sent.number}</h3><p role="status" className="mt-2 font-semibold">{!pickup&&sent.status==="ready"?(es?"Listo para servir":"Ready to serve"):label}</p><p className="mt-2 text-sm text-white/80">{pickup?(sent.paymentStatus==="paid"?(es?"Pagado en caja":"Paid at the counter"):(es?"Paga al recoger en caja":"Pay at the counter on pickup")):context.tableName}</p>{!terminal.has(sent.status)&&<p className="mt-2 text-xs text-white/60">{es?"El estado se actualiza automáticamente. Puedes cerrar la carta y volver a abrirla.":"Status updates automatically. You can close and reopen this menu."}</p>}{error&&<p role="alert" className="mt-2 text-xs text-amber-200">{error}</p>}{terminal.has(sent.status)&&<button type="button" onClick={()=>{setSent(null);setError("")}} className="mt-3 border border-white/30 px-4 py-2 text-sm">{es?"Nuevo pedido":"New order"}</button>}</section>}
  if(!loaded||!lines.length)return null;
  return <section className="mt-4 border-t border-white/20 pt-4"><div className="flex items-center gap-2"><ChefHat size={18} style={{color:accent}}/><strong>{pickup?(es?"Recoger en caja":"Counter pickup"):context.tableName}</strong></div>{context.active?<><p className="mt-2 text-xs text-white/75">{pickup?(es?"Revisa los productos. Pagarás al recoger tu pedido en caja.":"Review your items. Pay at the counter on pickup."):null}</p><textarea aria-label={es?"Nota para cocina":"Kitchen note"} value={note} onChange={e=>setNote(e.target.value)} maxLength={300} placeholder={es?"Nota para cocina (opcional)":"Kitchen note (optional)"} className="mt-3 min-h-16 w-full border border-white/20 bg-black/20 p-3 text-sm text-white"/><button type="button" disabled={sending||invalid} onClick={()=>void submit()} style={{background:accent,color:background}} className="mt-3 min-h-11 w-full p-3 font-bold disabled:opacity-50">{sending?(es?"Enviando…":"Sending…"):(es?"Confirmar y enviar a cocina":"Confirm and send to kitchen")}</button></>:<p role="status" className="mt-3 text-sm text-amber-100">{pickup?(es?"Los pedidos para recoger están pausados.":"Pickup orders are paused."):(es?"Esta mesa está cerrada. Pide al personal que la active.":"This table is closed. Ask staff to activate it.")}</p>}{error&&<p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}</section>;
}
