import {Ban,Building2,ChefHat,CircleDollarSign,Eye,Globe2} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {RestaurantsTable,type ManagedRestaurant} from "@/components/superadmin/restaurants-table";
import {manualBillingState} from "@/lib/manual-billing";
import {BillingOperations} from "@/components/superadmin/billing-operations";
import {RestaurantCapacity} from "@/components/superadmin/restaurant-capacity";
import {PlatformResourceUsage,type PlatformResourceMetrics} from "@/components/superadmin/platform-resource-usage";
import {restaurantCapacity,storageCapacityGb} from "@/lib/platform-capacity";
import {PlatformGrowth} from "@/components/superadmin/platform-growth";
import {PlatformOperationsStatus} from "@/components/superadmin/operations-status";
import {TranslationProviderStatus} from "@/components/superadmin/translation-provider-status";
import {translationProviderStatus} from "@/lib/automatic-translation";
import {TrialSalesOverview} from "@/components/superadmin/trial-sales-overview";
import {TrialFollowupInbox,type TrialFollowupItem} from "@/components/superadmin/trial-followup-inbox";
import {signupPlanName} from "@/lib/signup-plans";
import type {PaymentReminderChannel} from "@/lib/payment-reminders";
import type {SalesStage} from "@/lib/sales-stages";

function countRelation(value:unknown){return Array.isArray(value)?Number((value[0] as {count?:number}|undefined)?.count??0):0}
function subscriptionRelation(value:unknown){const relation=Array.isArray(value)?value[0]:value;return relation as {provider?:string;current_period_end?:string|null}|null}
function productRelation(value:unknown){const relation=Array.isArray(value)?value[0]:value;return relation as {video_path?:string|null}|null}
function reminderChannel(details:unknown):PaymentReminderChannel|null{if(!details||typeof details!=="object"||Array.isArray(details))return null;const channel=(details as Record<string,unknown>).channel;return channel==="copy"||channel==="whatsapp"||channel==="email"?channel:null}

export default async function SuperadminPage({searchParams}:{searchParams:Promise<{expiration?:string;processed?:string;cleanup?:string}>}){
  const result=await searchParams;
  const {admin}=await requireSuperadmin();
  const analyticsFrom=new Date();analyticsFrom.setUTCDate(analyticsFrom.getUTCDate()-29);
  const[{data,error},{data:analytics,error:analyticsError},{data:resourceRows,error:resourceError},{data:cleanupRuns,error:cleanupError},translationStatus,{data:trialFollowups,error:trialFollowupError},{data:salesRows,error:salesError}]=await Promise.all([admin.from("restaurants").select("id,name,slug,email,phone,is_published,access_suspended,subscription_status,plan,signup_plan_interest,ordering_enabled,menu_template,created_at,products(count),categories(count),restaurant_members(count),subscriptions(provider,current_period_end)").order("created_at",{ascending:false}),admin.from("menu_analytics_daily").select("event_type,event_count,product_id,products(video_path)").gte("event_date",analyticsFrom.toISOString().slice(0,10)),admin.rpc("get_platform_resource_metrics"),admin.from("superadmin_audit_log").select("action,details,created_at").in("action",["platform.trash_cleanup_completed","platform.trash_cleanup_failed"]).order("created_at",{ascending:false}).limit(1),translationProviderStatus(),admin.from("superadmin_audit_log").select("restaurant_id,details,created_at").eq("action","trial.reminder_prepared").order("created_at",{ascending:false}).limit(500),admin.from("restaurant_sales_status").select("restaurant_id,stage,note")]);
  if(error||analyticsError||cleanupError||trialFollowupError||salesError)throw new Error(error?.message??analyticsError?.message??cleanupError?.message??trialFollowupError?.message??salesError?.message);
  const restaurants:ManagedRestaurant[]=(data??[]).map(item=>{const subscription=subscriptionRelation(item.subscriptions);return{id:item.id,name:item.name,slug:item.slug,email:item.email,phone:item.phone,isPublished:item.is_published,isSuspended:Boolean(item.access_suspended),orderingEnabled:Boolean(item.ordering_enabled),status:item.subscription_status,currentPlan:item.plan??(item.ordering_enabled?"pedidos":"carta"),planInterest:item.signup_plan_interest??"carta",template:item.menu_template,products:countRelation(item.products),categories:countRelation(item.categories),members:countRelation(item.restaurant_members),createdAt:item.created_at,paymentProvider:subscription?.provider??null,periodEnd:subscription?.current_period_end??null,billingState:manualBillingState(subscription?.current_period_end)}});
  const lastTrialContact=new Map<string,{createdAt:string;channel:PaymentReminderChannel}>();
  for(const row of trialFollowups??[]){const channel=reminderChannel(row.details);if(row.restaurant_id&&channel&&!lastTrialContact.has(row.restaurant_id))lastTrialContact.set(row.restaurant_id,{createdAt:row.created_at,channel})}
  const salesByRestaurant=new Map((salesRows??[]).map(row=>[row.restaurant_id,{stage:row.stage as SalesStage,note:row.note??""}]));
  const trialItems:TrialFollowupItem[]=restaurants.filter(item=>item.status==="trialing"&&item.periodEnd&&!item.isSuspended).map(item=>{const sales=salesByRestaurant.get(item.id);return{restaurantId:item.id,restaurantName:item.name,planName:signupPlanName(item.planInterest),phone:item.phone,email:item.email,periodEnd:item.periodEnd!,salesStage:sales?.stage??"new",salesNote:sales?.note??"",lastContact:lastTrialContact.get(item.id)??null}}).sort((a,b)=>new Date(a.periodEnd).getTime()-new Date(b.periodEnd).getTime());
  const published=restaurants.filter(item=>item.isPublished&&!item.isSuspended).length;
  const suspended=restaurants.filter(item=>item.isSuspended).length;
  const ordering=restaurants.filter(item=>item.orderingEnabled).length;
  const overdue=restaurants.filter(item=>item.billingState==="overdue").length;
  const dueSoon=restaurants.filter(item=>item.billingState==="due_soon").length;
  const paymentsDue=overdue+dueSoon;
  const platformViews=(analytics??[]).filter(row=>row.event_type==="menu_view").reduce((total,row)=>total+Number(row.event_count),0);
  const productViews=(analytics??[]).filter(row=>row.event_type==="product_view").reduce((total,row)=>total+Number(row.event_count),0);
  const hostedVideoViews=(analytics??[]).filter(row=>row.event_type==="product_view"&&Boolean(productRelation(row.products)?.video_path)).reduce((total,row)=>total+Number(row.event_count),0);
  const rawMetrics=Array.isArray(resourceRows)?resourceRows[0]:resourceRows;
  const resourceMetrics:PlatformResourceMetrics|null=!resourceError&&rawMetrics?{storageBytes:Number(rawMetrics.storage_bytes??0),videoBytes:Number(rawMetrics.video_bytes??0),logoBytes:Number(rawMetrics.logo_bytes??0),storageObjects:Number(rawMetrics.storage_objects??0),uploadedVideos:Number(rawMetrics.uploaded_videos??0),uploadedLogos:Number(rawMetrics.uploaded_logos??0)}:null;
  const processed=Number(result.processed??0);
  const operationResult=result.expiration==="suspended"?(processed===1?"1 restaurante suspendido":`${processed} restaurantes suspendidos`):(processed===1?"1 restaurante marcado como pago pendiente":`${processed} restaurantes marcados como pago pendiente`);
  const configuredCapacity=restaurantCapacity(process.env.SUPERADMIN_RESTAURANT_CAPACITY);
  return <main className="mx-auto max-w-7xl p-4 md:p-6"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-700">Control de plataforma</p><h1 className="mt-2 text-3xl font-extrabold">Restaurantes</h1><p className="mt-1 text-sm text-slate-600">Gestiona soporte, publicación, pagos manuales y acceso.</p></div>{result.expiration&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-800">Operación completada: {operationResult}.</div>}<PlatformOperationsStatus run={cleanupRuns?.[0]??null} result={result.cleanup}/><TranslationProviderStatus provider={translationStatus}/><section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6"><Metric icon={<Building2/>} label="Restaurantes" value={restaurants.length}/><Metric icon={<Globe2/>} label="Publicados" value={published}/><Metric icon={<ChefHat/>} label="Plan Pedidos" value={ordering}/><Metric icon={<Eye/>} label="Visitas 30d" value={platformViews}/><Metric icon={<CircleDollarSign/>} label="Por revisar" value={paymentsDue} danger={paymentsDue>0}/><Metric icon={<Ban/>} label="Suspendidos" value={suspended} danger={suspended>0}/></section><TrialSalesOverview restaurants={restaurants.map(item=>({status:item.status,planInterest:item.planInterest,periodEnd:item.periodEnd,isSuspended:item.isSuspended}))}/><TrialFollowupInbox items={trialItems}/><RestaurantCapacity current={restaurants.length} capacity={configuredCapacity}/><PlatformResourceUsage metrics={resourceMetrics} storageCapacityGb={storageCapacityGb(process.env.SUPERADMIN_STORAGE_CAPACITY_GB)} menuViews={platformViews} productViews={productViews} hostedVideoViews={hostedVideoViews}/><PlatformGrowth createdAt={restaurants.map(item=>item.createdAt)} capacity={configuredCapacity}/><BillingOperations overdue={overdue} dueSoon={dueSoon}/><RestaurantsTable restaurants={restaurants}/></main>;
}

function Metric({icon,label,value,danger=false}:{icon:React.ReactNode;label:string;value:number;danger?:boolean}){return <div className={`rounded-2xl border p-4 ${danger?"border-red-500/25 bg-red-500/[.07]":"border-stone-200 bg-white"}`}><div className={`flex items-center gap-2 text-xs font-semibold uppercase ${danger?"text-red-700":"text-slate-500"}`}>{icon}{label}</div><p className="mt-3 text-3xl font-black tabular-nums">{value}</p></div>}
