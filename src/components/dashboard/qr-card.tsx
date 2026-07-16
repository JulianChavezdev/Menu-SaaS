"use client";

import Image from "next/image";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
import {toast} from "sonner";

export function QrCard({url}:{url:string}){
  const[src,setSrc]=useState("");
  useEffect(()=>{
    let active=true;
    void QRCode.toDataURL(url,{width:512,margin:2,color:{dark:"#0f172a",light:"#ffffff"}})
      .then(value=>{if(active)setSrc(value)})
      .catch(()=>toast.error("No se pudo generar el código QR."));
    return()=>{active=false};
  },[url]);

  async function copy(){
    try{await navigator.clipboard.writeText(url);toast.success("URL copiada")}
    catch{toast.error("No se pudo copiar la URL.")}
  }

  return <div className="glass mx-auto max-w-md rounded-2xl p-4 text-center sm:p-6">
    {src&&<Image className="mx-auto h-auto w-full max-w-[320px] rounded-xl" src={src} alt={`Código QR de ${url}`} width={512} height={512} unoptimized/>}
    <p className="mt-4 break-all text-sm">{url}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <button type="button" onClick={()=>void copy()} className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100">Copiar URL</button>
      {src&&<a className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100" href={src} download="carta-qr.png">Descargar PNG</a>}
      <a className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100" href={url} target="_blank" rel="noopener noreferrer">Abrir carta</a>
    </div>
  </div>;
}
