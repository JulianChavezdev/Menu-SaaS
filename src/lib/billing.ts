type CheckoutInput={priceId:string;restaurantId:string;appUrl:string;email?:string|null};

export function checkoutIsConfigured(secretKey:string|undefined,priceId:string|undefined){
  return Boolean(secretKey?.match(/^sk_(test|live)_/)&&priceId?.startsWith("price_"));
}

export function buildCheckoutParams({priceId,restaurantId,appUrl,email}:CheckoutInput){
  const base=new URL(appUrl);
  if(base.protocol!=="https:"&&base.hostname!=="localhost")throw new Error("La URL de la aplicación debe usar HTTPS.");
  const params=new URLSearchParams({
    mode:"subscription",
    success_url:new URL("/dashboard/billing?checkout=success",base).toString(),
    cancel_url:new URL("/dashboard/billing?checkout=canceled",base).toString(),
    client_reference_id:restaurantId,
    "line_items[0][price]":priceId,
    "line_items[0][quantity]":"1",
    "metadata[restaurant_id]":restaurantId,
    "subscription_data[metadata][restaurant_id]":restaurantId,
  });
  if(email)params.set("customer_email",email);
  return params;
}
