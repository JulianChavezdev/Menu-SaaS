export type PaymentReminderChannel="copy"|"whatsapp"|"email";

export function paymentReminderMessage({restaurantName,periodEnd}:{restaurantName:string;periodEnd:string}){
  const date=new Intl.DateTimeFormat("es-ES",{dateStyle:"long",timeZone:"Europe/Madrid"}).format(new Date(periodEnd));
  return`Hola, ${restaurantName}. Te recordamos que la suscripción de tu carta vence el ${date}. Cuando realices el pago, envíanos el justificante para mantener activo el servicio. Gracias.`;
}

export function normalizeReminderPhone(phone:string|null|undefined){
  const digits=phone?.replace(/\D/g,"")??"";
  return digits.length===9?`34${digits}`:digits;
}

export function paymentReminderLinks({message,phone,email}:{message:string;phone:string|null;email:string|null}){
  const phoneDigits=normalizeReminderPhone(phone);
  return{
    whatsapp:phoneDigits?`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`:null,
    email:email?`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Recordatorio de suscripción")}&body=${encodeURIComponent(message)}`:null,
  };
}

export function paymentReminderChannelLabel(channel:PaymentReminderChannel){
  return channel==="whatsapp"?"WhatsApp":channel==="email"?"correo":"copia";
}
