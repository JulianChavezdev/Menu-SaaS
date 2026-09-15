import {selectionSchema,selectionKey,type CustomizationSelection} from "./product-customization";
export type CartLine={productId:string;quantity:number;note:string;selection?:CustomizationSelection};
export function cartLineKey(line:Pick<CartLine,"productId"|"selection">){const key=selectionKey(line.selection);return key?`${line.productId}/${key}`:line.productId}

export function parseCart(value:string|null):CartLine[]{
  if(!value)return[];
  try{
    const parsed:unknown=JSON.parse(value);
    if(!Array.isArray(parsed))return[];
    return parsed.flatMap(item=>{
      if(!item||typeof item!=="object")return[];
      const candidate=item as Partial<CartLine>;
      if(typeof candidate.productId!=="string"||!Number.isInteger(candidate.quantity)||Number(candidate.quantity)<1)return[];
      const selection=selectionSchema.safeParse(candidate.selection??[]);if(!selection.success)return[];
      return[{productId:candidate.productId,quantity:Math.min(Number(candidate.quantity),99),note:typeof candidate.note==="string"?candidate.note.slice(0,300):"",...(selection.data.length?{selection:selection.data}:{})}];
    });
  }catch{return[]}
}

export function addCartItem(lines:CartLine[],productId:string,selection?:CustomizationSelection){
  const candidate={productId,...(selection?.length?{selection}:{})};const key=cartLineKey(candidate);
  const existing=lines.find(line=>cartLineKey(line)===key);
  if(!existing)return[...lines,{...candidate,quantity:1,note:""}];
  return lines.map(line=>cartLineKey(line)===key?{...line,quantity:Math.min(line.quantity+1,99)}:line);
}

export function changeCartQuantity(lines:CartLine[],productId:string,change:number){
  return lines.flatMap(line=>{
    if(cartLineKey(line)!==productId)return[line];
    const quantity=Math.min(line.quantity+change,99);
    return quantity>0?[{...line,quantity}]:[];
  });
}

export function updateCartNote(lines:CartLine[],productId:string,note:string){
  return lines.map(line=>cartLineKey(line)===productId?{...line,note:note.slice(0,300)}:line);
}
