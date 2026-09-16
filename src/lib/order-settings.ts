import {z} from "zod";
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const openingHoursSchema=z.array(z.object({day:z.number().int().min(0).max(6),periods:z.array(z.object({start:time,end:time})).max(3)})).length(7).refine(days=>new Set(days.map(d=>d.day)).size===7,"Revisa los días del horario");
export const defaultOpeningHours=Array.from({length:7},(_,day)=>({day,periods:[{start:"12:00",end:"23:00"}]}));
export const orderSettingsSchema=z.object({
  customer_order_mode:z.enum(["menu_only","table_orders"]),
  payment_timing:z.enum(["before","after"]),
  customer_orders_paused:z.boolean(),
  opening_hours:openingHoursSchema,
  timezone:z.string().refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true}catch{return false}},"Zona horaria no válida"),
});
export type OrderSettings=z.infer<typeof orderSettingsSchema>;
export const defaultOrderSettings:OrderSettings={customer_order_mode:"menu_only",payment_timing:"after",customer_orders_paused:false,opening_hours:defaultOpeningHours,timezone:"Europe/Madrid"};
export function waitsForPayment(order:{paymentTiming?:string;paymentStatus?:string;status:string}){
  return order.paymentTiming==="before"&&order.paymentStatus!=="paid"&&!['cancelled','rejected'].includes(order.status);
}
