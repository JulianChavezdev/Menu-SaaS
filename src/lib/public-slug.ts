export function normalizePublicSlug(value:string){
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export function isValidPublicSlug(value:string){
  return value.length>=3&&value.length<=60&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
