"use client";
import {useEffect,useRef,useState,useTransition} from "react";
import Image from "next/image";
import {Plus,Trash2,X} from "lucide-react";
import {toast} from "sonner";
import {createClient} from "@/lib/supabase/client";
import {saveProductCustomization} from "@/app/dashboard/menu/customization-actions";
import {emptyCustomization,type ProductCustomization} from "@/lib/product-customization";
import type {Product} from "@/lib/types";

export function ProductCustomizationEditor({product,restaurantId,onClose}:{product:Product;restaurantId:string;onClose:()=>void}){
  const [config,setConfig]=useState<ProductCustomization>(product.customization??emptyCustomization);
  const [busy,start]=useTransition();const[uploading,setUploading]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const previous=document.activeElement;const overflow=document.body.style.overflow;dialog.current?.showModal();document.body.style.overflow="hidden";return()=>{document.body.style.overflow=overflow;if(previous instanceof HTMLElement)previous.focus()}},[]);
  function groupChange(index:number,patch:Partial<ProductCustomization["groups"][number]>){setConfig(c=>({...c,groups:c.groups.map((g,i)=>i===index?{...g,...patch}:g)}))}
  function optionChange(groupId:string,optionId:string,patch:Partial<ProductCustomization["groups"][number]["options"][number]>){setConfig(c=>({...c,groups:c.groups.map(g=>g.id===groupId?{...g,options:g.options.map(o=>o.id===optionId?{...o,...patch}:o)}:g)}))}
  async function uploadPhoto(groupId:string,optionId:string,file:File){
    const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};const ext=extensions[file.type];
    if(!ext||file.size>5*1024*1024){toast.error("Usa JPG, PNG o WebP de hasta 5 MB");return}
    setUploading(true);
    try{const client=createClient();const path=`restaurants/${restaurantId}/products/${product.id}/image-${crypto.randomUUID()}.${ext}`;
      const{error}=await client.storage.from("restaurant-media").upload(path,file,{contentType:file.type,cacheControl:"31536000"});if(error)throw error;
      optionChange(groupId,optionId,{imageUrl:client.storage.from("restaurant-media").getPublicUrl(path).data.publicUrl});
    }catch{toast.error("No se pudo subir la foto")}finally{setUploading(false)}
  }
  return <dialog ref={dialog} onCancel={event=>{if(busy||uploading)event.preventDefault();else onClose()}} className="customization-editor" aria-label={`Personalizar ${product.name}`}>
    <header><div><h2>Personalización</h2><p>{product.name}</p></div><button type="button" disabled={busy||uploading} aria-label="Cerrar configuración" onClick={onClose}><X/></button></header>
    <form onSubmit={e=>{e.preventDefault();start(async()=>{try{await saveProductCustomization(product.id,config);toast.success("Personalización guardada");onClose()}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}})}}>
      <fieldset disabled={busy||uploading}>
        <label className="customization-enable"><input type="checkbox" checked={config.enabled} onChange={e=>setConfig(c=>({...c,enabled:e.target.checked}))}/><span><strong>Permitir personalizar este producto</strong><small>Los demás productos mantienen su funcionamiento habitual.</small></span></label>
        {config.enabled?<>
          <p className="customization-help">Crea grupos como Frutas, Sabores o Toppings. Para elegir exactamente 8, indica mínimo 8 y máximo 8. El suplemento se suma por cada opción elegida.</p>
          {config.groups.map((group,index)=><section key={group.id} className="customization-group">
            <div className="customization-group-fields">
              <label>Nombre del grupo<input required maxLength={70} value={group.name} onChange={e=>groupChange(index,{name:e.target.value})}/></label>
              <label>Mínimo<input required type="number" min={0} max={30} value={group.min} onChange={e=>groupChange(index,{min:Number(e.target.value)})}/></label>
              <label>Máximo<input required type="number" min={1} max={30} value={group.max} onChange={e=>groupChange(index,{max:Number(e.target.value)})}/></label>
              <button type="button" aria-label={`Quitar grupo ${group.name}`} onClick={()=>setConfig(c=>({...c,groups:c.groups.filter(g=>g.id!==group.id)}))}><Trash2 size={17}/></button>
            </div>
            <div className="customization-editor-options">{group.options.map((option,i)=><div key={option.id} className="customization-editor-option">
              <label className="customization-photo">{option.imageUrl?<Image width={56} height={56} src={option.imageUrl} alt={option.name||"Foto de la opción"}/>:<span>+ Foto</span>}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Foto de ${option.name||`opción ${i+1}`}`} onChange={e=>{if(e.target.files?.[0])void uploadPhoto(group.id,option.id,e.target.files[0]);e.target.value=""}}/></label>
              <label>Opción {i+1}<input required maxLength={70} value={option.name} placeholder="Ej. Fresa" onChange={e=>optionChange(group.id,option.id,{name:e.target.value})}/></label>
              <label>Extra (€)<input required type="number" min={0} max={1000} step="0.01" value={option.priceCents/100} onChange={e=>optionChange(group.id,option.id,{priceCents:Math.round(Number(e.target.value)*100)})}/></label>
              <label className="customization-available"><input type="checkbox" checked={option.available} onChange={e=>optionChange(group.id,option.id,{available:e.target.checked})}/>Disponible</label>
              <button type="button" aria-label={`Quitar opción ${option.name}`} onClick={()=>groupChange(index,{options:group.options.filter(o=>o.id!==option.id)})}><Trash2 size={16}/></button>
              {option.imageUrl&&<button type="button" className="customization-remove-photo" onClick={()=>optionChange(group.id,option.id,{imageUrl:null})}>Quitar foto de {option.name}</button>}
            </div>)}</div>
            <button type="button" className="workspace-button" disabled={group.options.length>=30} onClick={()=>groupChange(index,{options:[...group.options,{id:crypto.randomUUID(),name:"",priceCents:0,imageUrl:null,available:true}]})}><Plus size={15}/>Añadir opción</button>
            {group.options.filter(o=>o.available).length<group.min&&<p role="status" className="customization-warning">No hay suficientes opciones disponibles: este producto no podrá pedirse hasta reponerlas o ajustar el mínimo.</p>}
          </section>)}
          <button type="button" className="workspace-button" disabled={config.groups.length>=6} onClick={()=>setConfig(c=>({...c,groups:[...c.groups,{id:crypto.randomUUID(),name:"",min:0,max:1,options:[{id:crypto.randomUUID(),name:"",priceCents:0,imageUrl:null,available:true}]}]}))}><Plus size={15}/>Añadir grupo</button>
        </>:<p className="customization-help">El producto se añade directamente al carrito. Su configuración se conserva para poder reactivarla.</p>}
      </fieldset>
      <footer><button type="button" className="workspace-button" onClick={onClose} disabled={busy||uploading}>Cancelar</button><button className="workspace-button workspace-button-primary" disabled={busy||uploading}>{uploading?"Subiendo foto…":busy?"Guardando…":"Guardar personalización"}</button></footer>
    </form>
  </dialog>;
}
