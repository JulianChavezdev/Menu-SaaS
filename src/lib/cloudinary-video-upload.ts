export class CloudinaryUnavailableError extends Error{}

type Signature={
  cloudName:string;
  apiKey:string;
  signature:string;
  timestamp:number;
  folder:string;
  public_id:string;
  eager:string;
  expectedPublicId:string;
};

const CHUNK_SIZE=6*1024*1024;
const MAX_ATTEMPTS=3;

function cloudinaryError(xhr:XMLHttpRequest){
  try{
    const payload=JSON.parse(xhr.responseText) as {error?:{message?:string}|string};
    const message=typeof payload.error==="string"?payload.error:payload.error?.message;
    if(message)return message;
  }catch{}
  if(xhr.status===413)return"El vídeo supera el límite permitido por el servicio.";
  if(xhr.status===401)return"La autorización de subida ha caducado. Inténtalo de nuevo.";
  if(xhr.status===429)return"Hay demasiadas subidas simultáneas. Espera unos segundos.";
  return xhr.status?`Cloudinary rechazó el vídeo (${xhr.status}).`:"Se perdió la conexión durante la subida.";
}

function uploadChunk({
  blob,
  fileName,
  start,
  total,
  uploadId,
  config,
  onProgress,
}:{
  blob:Blob;
  fileName:string;
  start:number;
  total:number;
  uploadId:string;
  config:Signature;
  onProgress?:(value:number)=>void;
}){
  return new Promise<{done?:boolean;public_id?:string}>((resolve,reject)=>{
    const end=start+blob.size-1;
    const form=new FormData();
    form.set("file",blob,fileName);
    form.set("api_key",config.apiKey);
    form.set("timestamp",String(config.timestamp));
    form.set("signature",config.signature);
    form.set("folder",config.folder);
    form.set("public_id",config.public_id);
    form.set("eager",config.eager);

    const xhr=new XMLHttpRequest();
    xhr.open("POST",`https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`);
    xhr.setRequestHeader("X-Unique-Upload-Id",uploadId);
    xhr.setRequestHeader("Content-Range",`bytes ${start}-${end}/${total}`);
    xhr.timeout=5*60*1000;
    xhr.upload.onprogress=event=>{
      const loaded=Math.min(blob.size,event.loaded);
      onProgress?.(Math.min(99,Math.max(1,Math.round((start+loaded)/total*100))));
    };
    xhr.onerror=()=>reject(new Error("Se perdió la conexión durante la subida. Reintentando…"));
    xhr.ontimeout=()=>reject(new Error("La subida dejó de responder. Reintentando…"));
    xhr.onabort=()=>reject(new Error("La subida se canceló."));
    xhr.onload=()=>{
      if(xhr.status<200||xhr.status>=300){
        reject(new Error(cloudinaryError(xhr)));
        return;
      }
      try{resolve(JSON.parse(xhr.responseText) as {done?:boolean;public_id?:string})}
      catch{reject(new Error("Cloudinary devolvió una respuesta no válida."))}
    };
    xhr.send(form);
  });
}

export async function uploadCloudinaryVideo({
  file,
  restaurantId,
  productId,
  onProgress,
}:{
  file:File;
  restaurantId:string;
  productId:string;
  onProgress?:(value:number)=>void;
}){
  if(typeof navigator!=="undefined"&&!navigator.onLine)throw new Error("No hay conexión a internet.");
  onProgress?.(1);
  const signed=await fetch("/api/media/cloudinary-signature",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({restaurantId,productId}),
    cache:"no-store",
  });
  if(signed.status===503)throw new CloudinaryUnavailableError("Cloudinary no configurado");
  if(!signed.ok)throw new Error((await signed.json() as {error?:string}).error??"No se pudo autorizar la subida");
  const config=await signed.json() as Signature;
  const uploadId=crypto.randomUUID();
  let finalResponse:{done?:boolean;public_id?:string}|undefined;

  for(let start=0;start<file.size;start+=CHUNK_SIZE){
    const blob=file.slice(start,Math.min(start+CHUNK_SIZE,file.size),file.type);
    let lastError:unknown;
    for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
      try{
        finalResponse=await uploadChunk({blob,fileName:file.name,start,total:file.size,uploadId,config,onProgress});
        lastError=undefined;
        break;
      }catch(error){
        lastError=error;
        if(attempt<MAX_ATTEMPTS)await new Promise(resolve=>setTimeout(resolve,attempt*1000));
      }
    }
    if(lastError)throw lastError;
    onProgress?.(Math.min(99,Math.round(Math.min(start+blob.size,file.size)/file.size*100)));
  }

  if(finalResponse?.public_id&&finalResponse.public_id!==config.expectedPublicId)
    throw new Error("Cloudinary guardó el vídeo con un identificador inesperado.");
  onProgress?.(100);
  return{publicId:config.expectedPublicId};
}
