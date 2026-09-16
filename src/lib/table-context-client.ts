import {z} from "zod";
export const liveTableContextSchema=z.object({active:z.boolean(),enabled:z.boolean(),paymentTiming:z.enum(["before","after"]),expiresAt:z.string().nullable()});
export async function fetchTableContext(tableCode:string,signal?:AbortSignal){
  const response=await fetch(`/api/public/table-context?table=${encodeURIComponent(tableCode)}`,{cache:"no-store",signal});
  if(!response.ok)throw new Error("No se pudo comprobar la configuración de la mesa.");
  const payload=await response.json();return liveTableContextSchema.parse(payload.context);
}
