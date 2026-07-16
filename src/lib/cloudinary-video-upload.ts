export class CloudinaryUnavailableError extends Error{}
type Signature={cloudName:string;apiKey:string;signature:string;timestamp:number;folder:string;public_id:string;eager:string;expectedPublicId:string};

export async function uploadCloudinaryVideo({file,restaurantId,productId,onProgress}:{file:File;restaurantId:string;productId:string;onProgress?:(value:number)=>void}){
  const signed=await fetch("/api/media/cloudinary-signature",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({restaurantId,productId})});
  if(signed.status===503)throw new CloudinaryUnavailableError("Cloudinary no configurado");if(!signed.ok)throw new Error((await signed.json() as {error?:string}).error??"No se pudo autorizar la subida");const config=await signed.json() as Signature;
  const form=new FormData();form.set("file",file);form.set("api_key",config.apiKey);form.set("timestamp",String(config.timestamp));form.set("signature",config.signature);form.set("folder",config.folder);form.set("public_id",config.public_id);form.set("eager",config.eager);
  await new Promise<void>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open("POST",`https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`);xhr.upload.onprogress=event=>event.lengthComputable&&onProgress?.(Math.round(event.loaded/event.total*100));xhr.onerror=()=>reject(new Error("Se perdió la conexión durante la subida"));xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error("Cloudinary rechazó el vídeo"));xhr.send(form)});
  return{publicId:config.expectedPublicId};
}
