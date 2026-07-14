import {describe,expect,it} from "vitest";
import {addCartItem,changeCartQuantity,parseCart,updateCartNote} from "../src/lib/menu-cart";

describe("carrito local de la carta",()=>{
  it("añade productos, cambia cantidades y elimina al llegar a cero",()=>{
    const first=addCartItem([],"burger");
    expect(addCartItem(first,"burger")).toEqual([{productId:"burger",quantity:2,note:""}]);
    expect(changeCartQuantity(first,"burger",1)[0].quantity).toBe(2);
    expect(changeCartQuantity(first,"burger",-1)).toEqual([]);
  });

  it("guarda observaciones y limita entradas manipuladas",()=>{
    const line=updateCartNote([{productId:"burger",quantity:1,note:""}],"burger","Sin cebolla");
    expect(line[0].note).toBe("Sin cebolla");
    expect(parseCart('[{"productId":"burger","quantity":500,"note":"extra"}]')).toEqual([{productId:"burger",quantity:99,note:"extra"}]);
    expect(parseCart("not-json")).toEqual([]);
  });
});
