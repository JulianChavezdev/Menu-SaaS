export type PaymentReminderChannel="copy"|"whatsapp"|"email";

export function paymentReminderMessage({restaurantName,periodEnd}:{restaurantName:string;periodEnd:string}){
  const date=new Intl.DateTimeFormat("es-ES",{dateStyle:"long",timeZone:"UTC"}).format(new Date(periodEnd));
  return`Hola, ${restaurantName}. Te recordamos que la suscripción de tu carta vence el ${date}. Cuando realices el pago, envíanos el justificante para mantener activo el servicio. Gracias.`;
}

export function trialFollowupMessage({restaurantName,planName,periodEnd,daysRemaining}:{restaurantName:string;planName:string;periodEnd:string;daysRemaining:number}){
  const date=new Intl.DateTimeFormat("es-ES",{dateStyle:"long",timeZone:"UTC"}).format(new Date(periodEnd));
  if(daysRemaining>7)return`Hola, ${restaurantName}. ¿Cómo va la configuración de Menuly? Elegiste ${planName} y tu prueba está activa hasta el ${date}. Si necesitas ayuda para publicar tu carta, estamos disponibles.`;
  return`Hola, ${restaurantName}. Tu prueba de ${planName} termina el ${date}. Si quieres mantener la carta publicada sin interrupciones, responde a este mensaje y te ayudamos a activar el plan.`;
}

export function normalizeReminderPhone(phone:string|null|undefined){
  const digits=phone?.replace(/\D/g,"")??"";
  return digits.length===9?`34${digits}`:digits;
}

export function paymentReminderLinks({message,phone,email,subject="Recordatorio de suscripción"}:{message:string;phone:string|null;email:string|null;subject?:string}){
  const phoneDigits=normalizeReminderPhone(phone);
  return{
    whatsapp:phoneDigits?`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`:null,
    email:email?`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`:null,
  };
}

export function paymentReminderChannelLabel(channel:PaymentReminderChannel){
  return channel==="whatsapp"?"WhatsApp":channel==="email"?"correo":"copia";
}
