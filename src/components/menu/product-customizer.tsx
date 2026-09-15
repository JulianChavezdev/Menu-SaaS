"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {X,Check} from "lucide-react";
import type {Product} from "@/lib/types";
import {resolveCustomization,type CustomizationSelection} from "@/lib/product-customization";

export function ProductCustomizer({product,currency,language="es",panel,accent,onAccent,onClose,onConfirm,initial=[]}:{product:Product;currency:string;language?:"es"|"en";panel:string;accent:string;onAccent:string;onClose:()=>void;onConfirm:(selection:CustomizationSelection)=>void;initial?:CustomizationSelection}){
  const [selection,setSelection]=useState(initial);const dialog=useRef<HTMLDialogElement>(null);const es=language==="es";
  useEffect(()=>{const previous=document.activeElement;const overflow=document.body.style.overflow;dialog.current?.showModal();document.body.style.overflow="hidden";return()=>{document.body.style.overflow=overflow;if(previous instanceof HTMLElement)previous.focus()}},[]);
  let validation="";let extraCents=0;
  try{extraCents=resolveCustomization(product.customization,selection).extraCents}catch(error){validation=error instanceof Error?error.message:"Revisa las opciones"}
  if(validation)extraCents=(product.customization?.groups??[]).reduce((sum,g)=>sum+g.options.filter(o=>selection.find(s=>s.groupId===g.id)?.optionIds.includes(o.id)).reduce((n,o)=>n+o.priceCents,0),0);
  const money=(value:number)=>new Intl.NumberFormat(es?"es-ES":"en-GB",{style:"currency",currency}).format(value/100);
  return <dialog ref={dialog} className="product-customizer" data-menu-gesture-block style={{background:panel,color:"#fff","--custom-accent":accent} as React.CSSProperties} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()} onCancel={onClose} aria-label={`${es?"Personalizar":"Customize"} ${product.name}`}>
    <header><div><p>{es?"Arma tu pedido":"Build your order"}</p><h2>{product.name}</h2></div><button type="button" aria-label={es?"Cerrar personalización":"Close customization"} onClick={onClose}><X/></button></header>
    <div className="product-customizer-groups">{product.customization?.groups.map(group=>{
      const selected=selection.find(s=>s.groupId===group.id)?.optionIds??[];
      const enough=selected.length>=group.min&&selected.length<=group.max;
      return <fieldset key={group.id}><legend>{group.name}</legend><div className="product-customizer-rule"><span>{group.min===group.max?`${es?"Elige":"Choose"} ${group.max}`: `${es?"Elige de":"Choose"} ${group.min} ${es?"a":"to"} ${group.max}`}</span><strong aria-live="polite" style={{color:enough?accent:undefined}}>{selected.length} / {group.max}</strong></div>
        <div className="product-customizer-options">{group.options.map(option=>{
          const checked=selected.includes(option.id);const disabled=!option.available||(!checked&&selected.length>=group.max);
          return <label key={option.id} data-checked={checked} data-unavailable={!option.available}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={()=>setSelection(current=>[...current.filter(s=>s.groupId!==group.id),{groupId:group.id,optionIds:checked?selected.filter(id=>id!==option.id):[...selected,option.id]}])}/>
            {option.imageUrl&&<Image src={option.imageUrl} alt="" width={170} height={85} loading="lazy"/>}<span><strong>{option.name}</strong><small>{!option.available?(es?"Agotado":"Unavailable"):option.priceCents?`+${money(option.priceCents)}`:(es?"Incluido":"Included")}</small></span>{checked&&<Check size={16} aria-hidden="true"/>}
          </label>;
        })}</div>
      </fieldset>;
    })}</div>
    <footer>{validation&&<p role="status">{es?validation:"Complete the required selections to continue."}</p>}<button type="button" disabled={!!validation} style={{background:accent,color:onAccent}} onClick={()=>onConfirm(selection)}>{es?"Añadir al pedido":"Add to order"}<strong>{money(product.price_cents+extraCents)}</strong></button></footer>
  </dialog>;
}
