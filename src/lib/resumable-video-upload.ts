import * as tus from "tus-js-client";

const CHUNK_SIZE=6*1024*1024;

export function uploadVideoResumable({file,path,supabaseUrl,accessToken,onProgress}:{file:File;path:string;supabaseUrl:string;accessToken:string;onProgress?:(percent:number)=>void}){
  const fallbackType=path.toLowerCase().endsWith(".mov")?"video/quicktime":path.toLowerCase().endsWith(".webm")?"video/webm":"video/mp4";
  return new Promise<void>((resolve,reject)=>{
    const upload=new tus.Upload(file,{
      endpoint:`${supabaseUrl.replace(/\/$/,"")}/storage/v1/upload/resumable`,
      retryDelays:[0,1000,3000,5000,10000],
      headers:{authorization:`Bearer ${accessToken}`,"x-upsert":"false"},
      uploadDataDuringCreation:true,
      removeFingerprintOnSuccess:true,
      chunkSize:CHUNK_SIZE,
      metadata:{bucketName:"restaurant-media",objectName:path,contentType:file.type||fallbackType,cacheControl:"31536000"},
      onError:error=>reject(error),
      onProgress:(uploaded,total)=>onProgress?.(total>0?Math.round((uploaded/total)*100):0),
      onSuccess:()=>resolve(),
    });
    upload.start();
  });
}
