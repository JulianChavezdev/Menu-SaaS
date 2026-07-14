import {readFile} from "node:fs/promises";

const showcase=JSON.parse(await readFile(new URL("../supabase/showcase-data.json",import.meta.url),"utf8"));
const urls=[...new Set(showcase.restaurants.flatMap(restaurant=>restaurant.products.map(product=>product.videoUrl)))];
const maximumBytes=15*1024*1024;

const checks=await Promise.all(urls.map(async url=>{
  try{
    const response=await fetch(url,{method:"HEAD",signal:AbortSignal.timeout(15_000)});
    const bytes=Number(response.headers.get("content-length")||0);
    const contentType=response.headers.get("content-type")||"";
    const valid=response.ok&&contentType.startsWith("video/")&&bytes>0&&bytes<=maximumBytes;
    return {url,status:response.status,bytes,contentType,valid};
  }catch{return {url,status:0,bytes:0,contentType:"",valid:false}}
}));

for(const check of checks)console.log(`${check.valid?"OK   ":"ERROR"}  ${check.status||"---"}  ${(check.bytes/1024/1024).toFixed(1)} MB  ${check.url}`);
const failed=checks.filter(check=>!check.valid);
if(failed.length){console.error(`${failed.length} vídeo(s) no superaron la comprobación.`);process.exit(1)}
console.log(`${checks.length} vídeos únicos disponibles y por debajo de 15 MB.`);
