"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Upload,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {assignMedia} from "@/app/dashboard/actions";
import {toast} from "sonner";

type Option={id:string;name:string};
type Kind="product-video"|"logo";

const VIDEO_TYPES=["video/mp4","video/webm","video/quicktime"];
const IMAGE_TYPES=["image/jpeg","image/png","image/webp"];

export function MediaUpload({restaurantId,kind="logo",products=[],label,currentUrl}:{restaurantId:string;kind?:Kind;products?:Option[];label?:string;currentUrl?:string|null}){
  const router=useRouter();
  const[file,setFile]=useState<File|null>(null);
  const[preview,setPreview]=useState("");
  const[uploading,setUploading]=useState(false);
  const[productId,setProductId]=useState("");
  const video=kind==="product-video";
  const title=label??(video?"Vídeo del producto":"Logo");
  const maxBytes=video?50*1024*1024:5*1024*1024;

  useEffect(()=>{
    if(!file){setPreview("");return}
    const objectUrl=URL.createObjectURL(file);
    setPreview(objectUrl);
    return()=>URL.revokeObjectURL(objectUrl);
  },[file]);

  function choose(candidate:File){
    const valid=video?VIDEO_TYPES:IMAGE_TYPES;
    if(!valid.includes(candidate.type)){toast.error("Formato de archivo no válido.");return}
    if(candidate.size>maxBytes){toast.error(`El archivo supera el máximo de ${video?50:5} MB.`);return}
    setFile(candidate);
  }

  async function upload(){
    if(!file)return;
    if(video&&!productId){toast.error("Selecciona primero un producto.");return}
    setUploading(true);
    const supabase=createClient();
    let uploadedPath="";
    try{
      const ext=file.name.split(".").pop()?.toLowerCase()||"bin";
      uploadedPath=video
        ?`restaurants/${restaurantId}/products/${productId}/video-${crypto.randomUUID()}.${ext}`
        :`restaurants/${restaurantId}/branding/logo-${crypto.randomUUID()}.${ext}`;
      const {error}=await supabase.storage.from("restaurant-media").upload(uploadedPath,file,{upsert:false,contentType:file.type});
      if(error)throw error;
      await assignMedia(kind,uploadedPath,video?productId:undefined);
      toast.success(`${title} actualizado`);
      setFile(null);
      router.refresh();
    }catch(error){
      if(uploadedPath)await supabase.storage.from("restaurant-media").remove([uploadedPath]);
      toast.error(error instanceof Error?error.message:"No se pudo subir el archivo");
    }finally{setUploading(false)}
  }

  const shown=preview||currentUrl;
  return <div className="glass rounded-xl p-4">
    <h2 className="mb-1 font-bold">{title}</h2>
    <p className="mb-3 text-xs text-slate-400">{currentUrl?"Archivo actual guardado. Puedes reemplazarlo.":"Todavía no hay ningún archivo guardado."}</p>
    {video&&<select aria-label="Producto para el vídeo" value={productId} onChange={event=>setProductId(event.target.value)} className="mb-3 w-full rounded-lg p-2 text-slate-900"><option value="">Selecciona el producto</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select>}
    {shown&&<div className="mb-3">{video?<video src={shown} controls muted playsInline className="aspect-video w-full rounded-lg object-cover"/>:<div role="img" aria-label={`Vista previa de ${title}`} className="aspect-video rounded-lg bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${shown})`}}/>}</div>}
    <label onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const candidate=event.dataTransfer.files[0];if(candidate)choose(candidate)}} className="block cursor-pointer rounded-xl border-2 border-dashed border-white/25 p-5 text-center hover:bg-white/5">
      <input className="sr-only" type="file" accept={video?"video/mp4,video/webm,video/quicktime":"image/jpeg,image/png,image/webp"} onChange={event=>{const candidate=event.target.files?.[0];if(candidate)choose(candidate)}}/>
      <Upload className="mx-auto mb-2"/><span>{file?file.name:`Seleccionar o arrastrar ${video?"vídeo":"logo"}`}</span><span className="mt-1 block text-xs text-slate-400">Máximo {video?50:5} MB</span>
    </label>
    {file&&<div className="mt-3 flex gap-2"><button type="button" disabled={uploading} onClick={()=>void upload()} className="rounded-lg bg-violet-500 px-4 py-2 font-semibold disabled:opacity-50">{uploading?"Subiendo…":"Confirmar subida"}</button><button type="button" disabled={uploading} onClick={()=>setFile(null)} className="inline-flex items-center gap-1 rounded-lg border border-white/25 px-3 py-2"><X size={16}/>Cancelar</button></div>}
  </div>;
}
