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
