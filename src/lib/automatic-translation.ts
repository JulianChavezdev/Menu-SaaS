import {mergeTranslation,type TranslationFields,type TranslationMap} from "./translations";

export type AutomaticTranslationStatus="translated"|"not_configured"|"failed"|"empty";
export type AutomaticTranslationResult<T>={status:AutomaticTranslationStatus;value:T};
export type TranslationProviderStatus={status:"ready"|"not_configured"|"unavailable";used:number|null;limit:number|null};
type Fetcher=typeof fetch;

function endpoint(key:string,path:"translate"|"usage"){return `${key.endsWith(":fx")?"https://api-free.deepl.com":"https://api.deepl.com"}/v2/${path}`}

export function automaticTranslationConfigured(){return Boolean(process.env.DEEPL_API_KEY?.trim())}

export async function translateTextsToEnglish(texts:string[],options:{apiKey?:string;fetcher?:Fetcher}={}):Promise<AutomaticTranslationResult<string[]>>{
  const clean=texts.map(text=>text.trim());if(!clean.some(Boolean))return{status:"empty",value:clean};
  const key=(options.apiKey??process.env.DEEPL_API_KEY)?.trim();if(!key)return{status:"not_configured",value:clean};
  const fetcher=options.fetcher??fetch;const translated:string[]=[];
  try{
    for(let start=0;start<clean.length;start+=40){const batch=clean.slice(start,start+40);const nonEmpty=batch.map((text,index)=>({text,index})).filter(item=>item.text);if(!nonEmpty.length){translated.push(...batch);continue}
      const response=await fetcher(endpoint(key,"translate"),{method:"POST",headers:{Authorization:`DeepL-Auth-Key ${key}`,"Content-Type":"application/json"},body:JSON.stringify({text:nonEmpty.map(item=>item.text),source_lang:"ES",target_lang:"EN-US"}),cache:"no-store",signal:AbortSignal.timeout(12_000)});
      if(!response.ok)throw new Error(`DeepL HTTP ${response.status}`);const payload=await response.json() as {translations?:Array<{text?:unknown}>};if(payload.translations?.length!==nonEmpty.length)throw new Error("Respuesta de traducción incompleta");const byIndex=new Map(nonEmpty.map((item,index)=>[item.index,String(payload.translations![index].text??"").trim()]));translated.push(...batch.map((text,index)=>byIndex.get(index)||text));
    }
    return{status:"translated",value:translated};
  }catch{return{status:"failed",value:clean}}
}

export async function translationProviderStatus(options:{apiKey?:string;fetcher?:Fetcher}={}):Promise<TranslationProviderStatus>{
  const key=(options.apiKey??process.env.DEEPL_API_KEY)?.trim();
  if(!key)return{status:"not_configured",used:null,limit:null};
  try{
    const response=await (options.fetcher??fetch)(endpoint(key,"usage"),{headers:{Authorization:`DeepL-Auth-Key ${key}`},cache:"no-store",signal:AbortSignal.timeout(5_000)});
    if(!response.ok)return{status:"unavailable",used:null,limit:null};
    const payload=await response.json() as {character_count?:unknown;character_limit?:unknown;api_key_character_count?:unknown;api_key_character_limit?:unknown};
    const used=Number(payload.api_key_character_count??payload.character_count);
    const limit=Number(payload.api_key_character_limit??payload.character_limit);
    return{status:"ready",used:Number.isFinite(used)?used:null,limit:Number.isFinite(limit)&&limit>0?limit:null};
  }catch{return{status:"unavailable",used:null,limit:null}}
}

export async function translateFieldsToEnglish(fields:TranslationFields,options:{apiKey?:string;fetcher?:Fetcher}={}):Promise<AutomaticTranslationResult<TranslationFields>>{
  const entries=Object.entries(fields).filter((entry):entry is [keyof TranslationFields,string]=>typeof entry[1]==="string"&&Boolean(entry[1].trim()));
  const result=await translateTextsToEnglish(entries.map(([,value])=>value),options);return{status:result.status,value:Object.fromEntries(entries.map(([key],index)=>[key,result.value[index]])) as TranslationFields};
}

export function automaticTranslationMap(current:unknown,result:AutomaticTranslationResult<TranslationFields>,sourceChanged:boolean):TranslationMap{
  if(result.status==="translated")return mergeTranslation(current,"en",result.value);
  if(sourceChanged)return mergeTranslation(current,"en",{});
  return current&&typeof current==="object"&&!Array.isArray(current)?current as TranslationMap:{};
}
