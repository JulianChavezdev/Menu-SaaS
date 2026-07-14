import {Ban,Building2,CircleDollarSign,Globe2} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {RestaurantsTable,type ManagedRestaurant} from "@/components/superadmin/restaurants-table";
import {manualBillingState} from "@/lib/manual-billing";
import {BillingOperations} from "@/components/superadmin/billing-operations";

function countRelation(value:unknown){return Array.isArray(value)?Number((value[0] as {count?:number}|undefined)?.count??0):0}
function subscriptionRelation(value:unknown){const relation=Array.isArray(value)?value[0]:value;return relation as {provider?:string;current_period_end?:string|null}|null}

export default async function SuperadminPage({searchParams}:{searchParams:Promise<{expiration?:string;processed?:string}>}){
  const result=await searchParams;
  const {admin}=await requireSuperadmin();
  const {data,error}=await admin.from("restaurants").select("id,name,slug,is_published,access_suspended,subscription_status,menu_template,created_at,products(count),categories(count),restaurant_members(count),subscriptions(provider,current_period_end)").order("created_at",{ascending:false});
  if(error)throw new Error(error.message);
  const restaurants:ManagedRestaurant[]=(data??[]).map(item=>{const subscription=subscriptionRelation(item.subscriptions);return{id:item.id,name:item.name,slug:item.slug,isPublished:item.is_published,isSuspended:Boolean(item.access_suspended),status:item.subscription_status,template:item.menu_template,products:countRelation(item.products),categories:countRelation(item.categories),members:countRelation(item.restaurant_members),createdAt:item.created_at,paymentProvider:subscription?.provider??null,periodEnd:subscription?.current_period_end??null,billingState:manualBillingState(subscription?.current_period_end)}});
  const published=restaurants.filter(item=>item.isPublished&&!item.isSuspended).length;
  const suspended=restaurants.filter(item=>item.isSuspended).length;
  const overdue=restaurants.filter(item=>item.billingState==="overdue").length;
  const dueSoon=restaurants.filter(item=>item.billingState==="due_soon").length;
  const paymentsDue=overdue+dueSoon;
  const processed=Number(result.processed??0);
  const operationResult=result.expiration==="suspended"?(processed===1?"1 restaurante suspendido":`${processed} restaurantes suspendidos`):(processed===1?"1 restaurante marcado como pago pendiente":`${processed} restaurantes marcados como pago pendiente`);
  return <main className="mx-auto max-w-7xl p-4 md:p-6"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Control de plataforma</p><h1 className="mt-2 text-3xl font-extrabold">Restaurantes</h1><p className="mt-1 text-sm text-slate-400">Gestiona soporte, publicación, pagos por Bizum y acceso manual.</p></div>{result.expiration&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">Operación completada: {operationResult}.</div>}<section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={<Building2/>} label="Restaurantes" value={restaurants.length}/><Metric icon={<Globe2/>} label="Publicados" value={published}/><Metric icon={<CircleDollarSign/>} label="Por revisar" value={paymentsDue} danger={paymentsDue>0}/><Metric icon={<Ban/>} label="Suspendidos" value={suspended} danger={suspended>0}/></section><BillingOperations overdue={overdue} dueSoon={dueSoon}/><RestaurantsTable restaurants={restaurants}/></main>;
}

function Metric({icon,label,value,danger=false}:{icon:React.ReactNode;label:string;value:number;danger?:boolean}){return <div className={`rounded-2xl border p-4 ${danger?"border-red-500/25 bg-red-500/[.07]":"border-white/10 bg-slate-950/50"}`}><div className={`flex items-center gap-2 text-xs font-semibold uppercase ${danger?"text-red-300":"text-slate-500"}`}>{icon}{label}</div><p className="mt-3 text-3xl font-black tabular-nums">{value}</p></div>}
