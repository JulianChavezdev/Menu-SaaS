import {describe,it,expect} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {OrderHistoryItems} from "@/components/dashboard/order-history-items";

describe("order history detail",()=>{
  it("renders the purchased snapshots, quantities, prices, options and notes",()=>{
    const html=renderToStaticMarkup(<OrderHistoryItems currency="EUR" items={[{id:"item",product_name:"Ensalada de frutas",quantity:2,unit_price_cents:1250,line_total_cents:2500,note:"Sin hielo",selected_options:[{groupId:"fruit",groupName:"Frutas",optionId:"mango",name:"Mango",priceCents:0},{groupId:"extra",groupName:"EXTRA",optionId:"cream",name:"Nata",priceCents:50}]}]}/>);
    for(const text of ["2× Ensalada de frutas","25,00","12,50","Frutas:","Mango","EXTRA:","Nata","0,50","Sin hielo"])expect(html).toContain(text);
  });
  it("explains missing detail instead of presenting an empty list",()=>{
    const html=renderToStaticMarkup(<OrderHistoryItems currency="EUR" items={[]}/>);
    expect(html).toContain("No se ha podido recuperar el detalle");expect(html).not.toContain("<ul");
  });
});
