import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {invoiceSubscriptionId,mapStripeSubscriptionStatus,stripeId,stripePeriodEnd,verifyStripeSignature,type LocalSubscriptionStatus} from "@/lib/stripe-webhook";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type StripeEvent={id:string;type:string;data:{object:Record<string,unknown>}};

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret||!url||!serviceKey)return NextResponse.json({error:"Webhook no configurado"},{status:503});
  const payload=await request.text();
  const signature=request.headers.get("stripe-signature");
  if(!signature)return NextResponse.json({error:"Falta la firma"},{status:400});
  try{verifyStripeSignature(payload,signature,secret)}catch{return NextResponse.json({error:"Firma no válida"},{status:400})}
  let event:StripeEvent;
  try{event=JSON.parse(payload) as StripeEvent}catch{return NextResponse.json({error:"JSON no válido"},{status:400})}
  if(!event.id||!event.type||!event.data?.object)return NextResponse.json({error:"Evento no válido"},{status:400});

  const supabase=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const restaurantForSubscription=async(providerSubscriptionId:string)=>{const {data}=await supabase.from("subscriptions").select("restaurant_id").eq("provider_subscription_id",providerSubscriptionId).maybeSingle();return data?.restaurant_id as string|undefined};
  const syncStatus=async(restaurantId:string,status:LocalSubscriptionStatus,details:{providerSubscriptionId:string;providerCustomerId?:string|null;currentPeriodEnd?:string|null})=>{const values={restaurant_id:restaurantId,provider:"stripe",plan:"carta",status,provider_subscription_id:details.providerSubscriptionId,...(details.providerCustomerId?{provider_customer_id:details.providerCustomerId}:{}),...(details.currentPeriodEnd?{current_period_end:details.currentPeriodEnd}:{})};await supabase.from("subscriptions").upsert(values,{onConflict:"restaurant_id"}).throwOnError();await supabase.from("restaurants").update({subscription_status:status}).eq("id",restaurantId).throwOnError()};
  const {error:claimError}=await supabase.from("stripe_webhook_events").insert({event_id:event.id,event_type:event.type});
  if(claimError?.code==="23505")return NextResponse.json({received:true,duplicate:true});
  if(claimError)return NextResponse.json({error:"No se pudo registrar el evento"},{status:500});

  try{
    const object=event.data.object;
    if(event.type==="checkout.session.completed"){
      const restaurantId=typeof object.client_reference_id==="string"?object.client_reference_id:String((object.metadata as Record<string,unknown>|undefined)?.restaurant_id??"");
      if(restaurantId){
        const providerSubscriptionId=stripeId(object.subscription);const providerCustomerId=stripeId(object.customer);
        await supabase.from("subscriptions").upsert({restaurant_id:restaurantId,provider:"stripe",plan:"carta",...(providerSubscriptionId?{provider_subscription_id:providerSubscriptionId}:{}),...(providerCustomerId?{provider_customer_id:providerCustomerId}:{})},{onConflict:"restaurant_id"}).throwOnError();
      }
    }else if(event.type.startsWith("customer.subscription.")){
      const providerSubscriptionId=stripeId(object.id);if(!providerSubscriptionId)throw new Error("Suscripción sin identificador");
      const metadata=object.metadata as Record<string,unknown>|undefined;
      const restaurantId=typeof metadata?.restaurant_id==="string"?metadata.restaurant_id:await restaurantForSubscription(providerSubscriptionId);
      if(!restaurantId)throw new Error("Suscripción sin restaurante");
      const status=event.type==="customer.subscription.deleted"?"canceled":mapStripeSubscriptionStatus(String(object.status??"past_due"));
      await syncStatus(restaurantId,status,{providerSubscriptionId,providerCustomerId:stripeId(object.customer),currentPeriodEnd:stripePeriodEnd(object.current_period_end)});
    }else if(event.type==="invoice.paid"||event.type==="invoice.payment_failed"){
      const providerSubscriptionId=invoiceSubscriptionId(object);
      if(providerSubscriptionId){const restaurantId=await restaurantForSubscription(providerSubscriptionId);if(restaurantId)await syncStatus(restaurantId,event.type==="invoice.paid"?"active":"past_due",{providerSubscriptionId})}
    }
    await supabase.from("stripe_webhook_events").update({status:"processed",processed_at:new Date().toISOString()}).eq("event_id",event.id).throwOnError();
    return NextResponse.json({received:true});
  }catch{
    await supabase.from("stripe_webhook_events").delete().eq("event_id",event.id);
    return NextResponse.json({error:"No se pudo procesar el evento"},{status:500});
  }
}
