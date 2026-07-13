import {createHmac,timingSafeEqual} from "node:crypto";

export type LocalSubscriptionStatus="trialing"|"active"|"past_due"|"canceled";

export function verifyStripeSignature(payload:string,header:string,secret:string,now=Math.floor(Date.now()/1000),tolerance=300){
  const values=header.split(",").map(part=>part.trim().split("=",2));
  const timestamp=Number(values.find(([key])=>key==="t")?.[1]);
  const signatures=values.filter(([key])=>key==="v1").map(([,value])=>value);
  if(!Number.isFinite(timestamp)||!signatures.length)throw new Error("Firma de Stripe incompleta.");
  if(Math.abs(now-timestamp)>tolerance)throw new Error("Firma de Stripe caducada.");
  const expected=createHmac("sha256",secret).update(`${timestamp}.${payload}`,"utf8").digest("hex");
  const expectedBuffer=Buffer.from(expected,"hex");
  const valid=signatures.some(signature=>{try{const received=Buffer.from(signature,"hex");return received.length===expectedBuffer.length&&timingSafeEqual(received,expectedBuffer)}catch{return false}});
  if(!valid)throw new Error("Firma de Stripe no válida.");
}

export function mapStripeSubscriptionStatus(status:string):LocalSubscriptionStatus{
  if(status==="active")return "active";
  if(status==="trialing")return "trialing";
  if(status==="canceled"||status==="incomplete_expired")return "canceled";
  return "past_due";
}

export function stripeId(value:unknown){
  if(typeof value==="string")return value;
  if(value&&typeof value==="object"&&"id" in value&&typeof value.id==="string")return value.id;
  return null;
}

export function invoiceSubscriptionId(invoice:Record<string,unknown>){
  const direct=stripeId(invoice.subscription);
  if(direct)return direct;
  const parent=invoice.parent as {subscription_details?:{subscription?:unknown}}|undefined;
  return stripeId(parent?.subscription_details?.subscription);
}

export function stripePeriodEnd(value:unknown){return typeof value==="number"&&Number.isFinite(value)?new Date(value*1000).toISOString():null}
