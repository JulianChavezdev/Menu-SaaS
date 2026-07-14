export type MediaKind="product-video"|"logo";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidMediaPath({kind,path,restaurantId,productId}:{kind:MediaKind;path:string;restaurantId:string;productId?:string}){
  if(!UUID.test(restaurantId))return false;
  if(kind==="product-video"){
    if(!productId||!UUID.test(productId))return false;
    return new RegExp(`^restaurants/${restaurantId}/products/${productId}/video-[0-9a-f-]+\\.(mp4|webm|mov)$`,"i").test(path);
  }
  return new RegExp(`^restaurants/${restaurantId}/branding/logo-[0-9a-f-]+\\.(jpg|jpeg|png|webp)$`,"i").test(path);
}

export function storagePathFromPublicUrl(value:string|null|undefined,bucket:string){
  if(!value)return null;
  try{
    const marker=`/storage/v1/object/public/${bucket}/`;
    const path=new URL(value).pathname;
    const index=path.indexOf(marker);
    if(index<0)return null;
    const decoded=decodeURIComponent(path.slice(index+marker.length));
    return decoded.startsWith("restaurants/")&&!decoded.split("/").includes("..")?decoded:null;
  }catch{return null}
}
