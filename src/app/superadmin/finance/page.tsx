import {AlertTriangle,CalendarClock,CircleDollarSign,Landmark,ReceiptText,WalletCards} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {formatCurrencyTotals,isFinancialRestaurant,manualFinanceSnapshot} from "@/lib/manual-finance";
import {manualBillingState} from "@/lib/manual-billing";
import {filterLedgerPayments,type ManualPaymentRow} from "@/lib/manual-payment-ledger";
import {FinanceLedger,type FinanceFilters} from "@/components/superadmin/finance-ledger";
import {CollectionsInbox,type CollectionItem} from "@/components/superadmin/collections-inbox";
import type {PaymentReminderChannel} from "@/lib/payment-reminders";

type Restaurant={id:string;name:string;slug:string;access_suspended?:boolean;email:string|null;phone:string|null};
type Relation=Restaurant|Restaurant[]|null;
type Subscription={restaurant_id:string;status:string;current_period_end:string|null;restaurants:Relation};
type ReminderAudit={restaurant_id:string|null;details:unknown;created_at:string};
function related(value:Relation){return Array.isArray(value)?value[0]??null:value}
function reminderChannel(details:unknown):PaymentReminderChannel|null{if(!details||typeof details!=="object"||Array.isArray(details))return null;const channel=(details as Record<string,unknown>).channel;return channel==="copy"||channel==="whatsapp"||channel==="email"?channel:null}

export default async function FinancePage({searchParams}:{searchParams:Promise<FinanceFilters>}){
  const filters=await searchParams;const {admin}=await requireSuperadmin();
  const[{data:paymentData,error:paymentError},{data:subscriptionData,error:subscriptionError},{data:reminderData,error:reminderError}]=await Promise.all([
    admin.from("manual_payments").select("id,amount_cents,currency,method,paid_at,period_end,restaurants(id,name,slug)").order("paid_at",{ascending:false}).limit(5000),
    admin.from("subscriptions").select("restaurant_id,status,current_period_end,restaurants(id,name,slug,access_suspended,email,phone)").eq("provider","manual").order("current_period_end",{ascending:true}),
    admin.from("superadmin_audit_log").select("restaurant_id,details,created_at").eq("action","payment.reminder_prepared").order("created_at",{ascending:false}).limit(500),
  ]);
  if(paymentError||subscriptionError||reminderError)throw new Error(paymentError?.message??subscriptionError?.message??reminderError?.message);
  const payments=filterLedgerPayments((paymentData??[]) as ManualPaymentRow[],{});
  const subscriptions=((subscriptionData??[]) as Subscription[]).filter(item=>isFinancialRestaurant(related(item.restaurants)?.slug));
  const snapshot=manualFinanceSnapshot(payments);const active=subscriptions.filter(item=>item.status==="active").length;const dueSoon=subscriptions.filter(item=>manualBillingState(item.current_period_end)==="due_soon").length;const overdue=subscriptions.filter(item=>manualBillingState(item.current_period_end)==="overdue").length;const peak=Math.max(1,...snapshot.months.map(month=>month.count));
  const lastContact=new Map<string,{createdAt:string;channel:PaymentReminderChannel}>();
  for(const row of (reminderData??[]) as ReminderAudit[]){const channel=reminderChannel(row.details);if(row.restaurant_id&&channel&&!lastContact.has(row.restaurant_id))lastContact.set(row.restaurant_id,{createdAt:row.created_at,channel})}
  const collectionItems=subscriptions.flatMap((subscription):CollectionItem[]=>{const restaurant=related(subscription.restaurants);const state=manualBillingState(subscription.current_period_end);if(!restaurant||!subscription.current_period_end||(state!=="due_soon"&&state!=="overdue"))return[];return[{restaurantId:restaurant.id,restaurantName:restaurant.name,phone:restaurant.phone,email:restaurant.email,periodEnd:subscription.current_period_end,state,suspended:Boolean(restaurant.access_suspended),lastContact:lastContact.get(restaurant.id)??null}] }).sort((a,b)=>a.state===b.state?new Date(a.periodEnd).getTime()-new Date(b.periodEnd).getTime():a.state==="overdue"?-1:1);
  return <main className="mx-auto max-w-7xl p-4 md:p-6"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-800"><Landmark size={23}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Cobros provisionales</p><h1 className="mt-1 text-3xl font-extrabold">Finanzas manuales</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Resumen de pagos registrados por Bizum, transferencia, efectivo u otros medios. Las monedas se mantienen separadas.</p></div></div>
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric icon={<CircleDollarSign/>} label="Cobrado este mes" value={formatCurrencyTotals(snapshot.current.totals)} wide/><Metric icon={<ReceiptText/>} label="Pagos este mes" value={String(snapshot.current.count)}/><Metric icon={<WalletCards/>} label="Planes activos" value={String(active)}/><Metric icon={<CalendarClock/>} label="Vencen pronto" value={String(dueSoon)} warning={dueSoon>0}/><Metric icon={<AlertTriangle/>} label="Vencidos" value={String(overdue)} danger={overdue>0}/></section>
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">Últimos seis meses</p><h2 className="mt-1 text-xl font-bold">Evolución de cobros</h2><p className="mt-1 text-sm text-slate-600">La altura representa número de pagos; cada importe conserva su moneda.</p></div><div className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Total histórico:</span> {formatCurrencyTotals(snapshot.allTime)}</div></div><div aria-label="Pagos mensuales" className="mt-5 flex min-h-52 items-end gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 px-3 pb-3 pt-6">{snapshot.months.map(month=><div key={month.key} className="flex min-w-20 flex-1 flex-col items-center justify-end gap-2"><span className="max-w-28 text-center text-[10px] leading-tight text-slate-600">{formatCurrencyTotals(month.totals)}</span><strong className="text-xs tabular-nums">{month.count}</strong><div title={`${month.label}: ${month.count} pagos`} className="w-full max-w-14 rounded-t-lg bg-emerald-500" style={{height:`${Math.max(4,month.count/peak*105)}px`,opacity:month.count?1:.18}}/><span className="text-[10px] capitalize text-slate-500">{month.label}</span></div>)}</div></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><FinanceLedger payments={payments} filters={filters}/><CollectionsInbox items={collectionItems}/></div>
  </main>;
}

function Metric({icon,label,value,wide=false,warning=false,danger=false}:{icon:React.ReactNode;label:string;value:string;wide?:boolean;warning?:boolean;danger?:boolean}){return <div className={`rounded-2xl border p-4 ${wide?"col-span-2 lg:col-span-1":""} ${danger?"border-red-400/25 bg-red-400/[.07]":warning?"border-amber-400/25 bg-amber-400/[.06]":"border-stone-200 bg-white"}`}><div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-slate-500">{icon}{label}</div><p className="mt-3 break-words text-2xl font-black tabular-nums">{value}</p></div>}
