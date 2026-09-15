import {z} from "zod";
import {selectionSchema,resolveCustomization,type ProductCustomization} from "./product-customization";
export const orderLineSchema=z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(20),note:z.string().trim().max(300).default(""),selection:selectionSchema.default([])});
export const pickupOrderSchema=z.object({restaurantId:z.string().uuid(),requestId:z.string().uuid(),clientId:z.string().uuid(),lines:z.array(orderLineSchema).min(1).max(30),customerNote:z.string().trim().max(300).default("")});
export function priceOrderLines(lines:z.infer<typeof orderLineSchema>[],products:{id:string;name:string;price_cents:number;customization?:ProductCustomization|null;updated_at?:string}[],restaurantId:string){
  return lines.map(line=>{const product=products.find(p=>p.id===line.productId);if(!product)throw new Error("Algún producto ya no está disponible");const resolved=resolveCustomization(product.customization,line.selection);const price=product.price_cents+resolved.extraCents;return{restaurant_id:restaurantId,product_id:product.id,product_name:product.name,unit_price_cents:price,quantity:line.quantity,note:line.note||null,line_total_cents:price*line.quantity,selected_options:resolved.options,product_updated_at:product.updated_at}});
}
