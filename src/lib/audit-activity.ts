import {describeAuditEvent,isAuditGroup,type AuditGroup} from "./audit-events";

export type RestaurantRelation={name?:string;slug?:string}|Array<{name?:string;slug?:string}>|null;
export type AuditActivityRow={id:string;actor_user_id:string|null;restaurant_id:string|null;action:string;details:unknown;created_at:string;restaurants:RestaurantRelation};
export type AuditActivityItem={row:AuditActivityRow;event:ReturnType<typeof describeAuditEvent>;restaurant:{name?:string;slug?:string}|null;restaurantName:string|null};

function relation(value:RestaurantRelation){return Array.isArray(value)?value[0]??null:value}
function normalize(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function csvCell(value:unknown){let content=value===null||value===undefined?"":String(value);if(/^[=+\-@]/.test(content.trimStart()))content=`'${content}`;return`"${content.replaceAll('"','""')}"`}

export function safeActivityDate(value:unknown,endOfDay=false){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const date=new Date(`${value}T${endOfDay?"23:59:59.999":"00:00:00.000"}Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?date.toISOString():null;
}

export function activityItems(rows:AuditActivityRow[],filters:{group?:unknown;q?:unknown}={}):AuditActivityItem[]{
  const group:AuditGroup=isAuditGroup(filters.group)?filters.group:"all";const query=typeof filters.q==="string"?normalize(filters.q).slice(0,100):"";
  return rows.map(row=>{const event=describeAuditEvent(row.action,row.details);const restaurant=relation(row.restaurants);const deletedName=row.details&&typeof row.details==="object"&&!Array.isArray(row.details)&&typeof (row.details as Record<string,unknown>).restaurant_name==="string"?String((row.details as Record<string,unknown>).restaurant_name):null;return{row,event,restaurant,restaurantName:restaurant?.name??deletedName}}).filter(item=>group==="all"||item.event.group===group).filter(item=>!query||normalize([item.event.title,item.event.description,item.restaurantName??"",item.restaurant?.slug??""].join(" ")).includes(query));
}

export function activityCsv(items:AuditActivityItem[]){
  const headers=["fecha","categoría","evento","descripción","restaurante","slug","actor"];
  const rows=items.map(({row,event,restaurant,restaurantName})=>[row.created_at,event.group,event.title,event.description,restaurantName??"",restaurant?.slug??"",row.actor_user_id?"Superadmin":"Sistema"]);
  return`\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
