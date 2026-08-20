import {describe,expect,it} from "vitest";
import {normalizeReminderPhone,paymentReminderChannelLabel,paymentReminderLinks,paymentReminderMessage,trialFollowupMessage} from "../src/lib/payment-reminders";

describe("recordatorios de pago",()=>{
  it("prepara un mensaje fechado y personalizado",()=>{const message=paymentReminderMessage({restaurantName:"ILLEGAL FOOD",periodEnd:"2026-07-16T00:00:00.000Z"});expect(message).toContain("ILLEGAL FOOD");expect(message).toContain("16 de julio de 2026");expect(message).toContain("justificante")});
  it("mantiene la fecha de facturación aunque el vencimiento termine al final del día UTC",()=>{expect(paymentReminderMessage({restaurantName:"Test",periodEnd:"2026-07-16T23:59:59.999Z"})).toContain("16 de julio de 2026")});
  it("normaliza teléfonos españoles sin alterar números internacionales",()=>{expect(normalizeReminderPhone("643 663 194")).toBe("34643663194");expect(normalizeReminderPhone("+52 55 1234 5678")).toBe("525512345678");expect(normalizeReminderPhone(null)).toBe("")});
  it("crea enlaces codificados únicamente cuando existe el contacto",()=>{const links=paymentReminderLinks({message:"Hola & gracias",phone:"643663194",email:"cliente+test@example.com"});expect(links.whatsapp).toContain("https://wa.me/34643663194?text=Hola%20%26%20gracias");expect(links.email).toContain("mailto:cliente%2Btest%40example.com");expect(paymentReminderLinks({message:"Hola",phone:null,email:null})).toEqual({whatsapp:null,email:null})});
  it("presenta nombres legibles para todos los canales",()=>{expect(paymentReminderChannelLabel("copy")).toBe("copia");expect(paymentReminderChannelLabel("whatsapp")).toBe("WhatsApp");expect(paymentReminderChannelLabel("email")).toBe("correo")});
  it("adapta el seguimiento según se acerque el final de la prueba",()=>{
    const input={restaurantName:"Roma",planName:"Menuly Pedidos",periodEnd:"2026-09-19T12:00:00.000Z"};
    expect(trialFollowupMessage({...input,daysRemaining:20})).toContain("¿Cómo va la configuración");
    expect(trialFollowupMessage({...input,daysRemaining:7})).toContain("mantener la carta publicada");
  });
  it("permite personalizar el asunto del correo",()=>expect(paymentReminderLinks({message:"Hola",phone:null,email:"test@example.com",subject:"Prueba Menuly"}).email).toContain("subject=Prueba%20Menuly"));
});
