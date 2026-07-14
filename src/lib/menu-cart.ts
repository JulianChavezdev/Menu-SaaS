export type CartLine={productId:string;quantity:number;note:string};

export function parseCart(value:string|null):CartLine[]{
  if(!value)return[];
  try{
    const parsed:unknown=JSON.parse(value);
    if(!Array.isArray(parsed))return[];
    return parsed.flatMap(item=>{
      if(!item||typeof item!=="object")return[];
      const candidate=item as Partial<CartLine>;
      if(typeof candidate.productId!=="string"||!Number.isInteger(candidate.quantity)||Number(candidate.quantity)<1)return[];
      return[{productId:candidate.productId,quantity:Math.min(Number(candidate.quantity),99),note:typeof candidate.note==="string"?candidate.note.slice(0,300):""}];
    });
  }catch{return[]}
}

export function addCartItem(lines:CartLine[],productId:string){
  const existing=lines.find(line=>line.productId===productId);
  if(!existing)return[...lines,{productId,quantity:1,note:""}];
  return lines.map(line=>line.productId===productId?{...line,quantity:Math.min(line.quantity+1,99)}:line);
}

export function changeCartQuantity(lines:CartLine[],productId:string,change:number){
  return lines.flatMap(line=>{
    if(line.productId!==productId)return[line];
    const quantity=Math.min(line.quantity+change,99);
    return quantity>0?[{...line,quantity}]:[];
  });
}

export function updateCartNote(lines:CartLine[],productId:string,note:string){
  return lines.map(line=>line.productId===productId?{...line,note:note.slice(0,300)}:line);
}
