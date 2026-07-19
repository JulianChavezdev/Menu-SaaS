export const auditGroups=["all","restaurants","access","payments","content","system"] as const;
export type AuditGroup=(typeof auditGroups)[number];
export type AuditTone="neutral"|"success"|"warning"|"danger";

type Details=Record<string,unknown>;
type Description={title:string;description:string;group:Exclude<AuditGroup,"all">;tone:AuditTone};

function text(details:Details,key:string){const value=details[key];return typeof value==="string"?value:null}
function number(details:Details,key:string){const value=details[key];return typeof value==="number"&&Number.isFinite(value)?value:null}
function boolean(details:Details,key:string){const value=details[key];return typeof value==="boolean"?value:null}
function money(details:Details){const cents=number(details,"amount_cents");const currency=text(details,"currency")??"EUR";return cents===null?null:new Intl.NumberFormat("es-ES",{style:"currency",currency}).format(cents/100)}

export function isAuditGroup(value:unknown):value is AuditGroup{return typeof value==="string"&&auditGroups.includes(value as AuditGroup)}

export function describeAuditEvent(action:string,rawDetails:unknown):Description{
  const details=rawDetails&&typeof rawDetails==="object"&&!Array.isArray(rawDetails)?rawDetails as Details:{};
  switch(action){
    case"access.suspended":return{title:"Acceso suspendido",description:"Se bloqueó temporalmente el acceso del restaurante.",group:"access",tone:"danger"};
    case"access.restored":return{title:"Acceso restaurado",description:"El restaurante recuperó el acceso a su panel.",group:"access",tone:"success"};
    case"access.expired_suspended":return{title:"Acceso suspendido por vencimiento",description:"Terminó el periodo de cortesía de la suscripción manual.",group:"access",tone:"danger"};
    case"payment.manual_recorded":return{title:"Pago registrado",description:money(details)?`Se registró un pago de ${money(details)}.`:"Se registró un pago manual.",group:"payments",tone:"success"};
    case"payment.expired_marked":return{title:"Pago pendiente",description:"La suscripción vencida se marcó para revisión.",group:"payments",tone:"warning"};
    case"payment.reminder_prepared":return{title:"Recordatorio preparado",description:"Se preparó un aviso de vencimiento para el restaurante.",group:"payments",tone:"neutral"};
    case"restaurant.deleted":return{title:"Restaurante eliminado",description:`${text(details,"restaurant_name")??"El restaurante"} se movió a la papelera.`,group:"restaurants",tone:"danger"};
    case"restaurant.deletion_backup_created":return{title:"Copia de eliminación creada",description:"Se guardó una copia recuperable antes de eliminar el restaurante.",group:"restaurants",tone:"warning"};
    case"restaurant.trial_expired_deleted":return{title:"Prueba finalizada",description:"La carta de prueba se eliminó y pasó temporalmente a la papelera.",group:"restaurants",tone:"danger"};
    case"restaurant.restored_from_trash":return{title:"Restaurante restaurado",description:"Se recuperó suspendido y sin publicar para su revisión.",group:"restaurants",tone:"success"};
    case"restaurant.trash_purged":return{title:"Papelera depurada",description:`Se cerró una copia vencida${number(details,"media_files_removed")?` y se eliminaron ${number(details,"media_files_removed")} archivos`:""}.`,group:"system",tone:"neutral"};
    case"restaurant.updated":return{title:"Configuración actualizada",description:"Se guardaron cambios administrativos del restaurante.",group:"restaurants",tone:"neutral"};
    case"restaurant.backup_created":return{title:"Punto de restauración creado",description:"Se guardó una copia privada de soporte.",group:"restaurants",tone:"success"};
    case"restaurant.backup_deleted":return{title:"Punto de restauración eliminado",description:"Se eliminó una copia privada antigua.",group:"restaurants",tone:"warning"};
    case"restaurant.backup_restored":return{title:"Copia restaurada",description:"Se aplicó una copia de seguridad al restaurante.",group:"restaurants",tone:"success"};
    case"category.updated":return{title:"Categoría actualizada",description:"Se modificó el nombre de una categoría desde soporte.",group:"content",tone:"neutral"};
    case"category.visibility":return{title:boolean(details,"is_active")?"Categoría publicada":"Categoría ocultada",description:"Cambió la visibilidad de una categoría.",group:"content",tone:boolean(details,"is_active")?"success":"warning"};
    case"product.updated":return{title:"Producto actualizado",description:"Se modificó un producto desde soporte.",group:"content",tone:"neutral"};
    case"product.availability":return{title:boolean(details,"is_available")?"Producto disponible":"Producto ocultado",description:"Cambió la disponibilidad de un producto.",group:"content",tone:boolean(details,"is_available")?"success":"warning"};
    case"platform.trash_cleanup_completed":return{title:"Limpieza automática completada",description:`${number(details,"processed")??0} copias revisadas y ${number(details,"failed")??0} fallos.`,group:"system",tone:"success"};
    case"platform.trash_cleanup_failed":return{title:"Limpieza automática fallida",description:"La tarea se detuvo de forma segura y requiere revisión.",group:"system",tone:"danger"};
    case"showcase.consolidation_backup_created":return{title:"Demo respaldada",description:"Se creó una copia privada antes de consolidar los restaurantes demo.",group:"system",tone:"success"};
    case"showcase.restaurants_consolidated":return{title:"Demos consolidadas",description:"Los restaurantes demo se unificaron en una sola carta completa.",group:"system",tone:"success"};
    default:return{title:"Actividad administrativa",description:"Se registró una acción interna de soporte.",group:"system",tone:"neutral"};
  }
}
