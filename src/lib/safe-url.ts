// Only browser navigation URLs, never executable or embedded documents.
export function safeExternalUrl(value:string|null|undefined):string|null{
  if(!value||value.length>2048||/[\u0000-\u0020\u007f]/.test(value))return null;
  try{const url=new URL(value);return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:null}catch{return null}
}
