import {formatCurrencyTotals,isFinancialRestaurant,type CurrencyTotals, type FinancePayment} from "./manual-finance";

export type PaymentRestaurant={id:string;name:string;slug:string}|null;
export type PaymentRestaurantRelation=PaymentRestaurant|PaymentRestaurant[];
export type ManualPaymentRow=FinancePayment&{id:string;method:string;period_end:string;restaurants:PaymentRestaurantRelation};
export const paymentMethods=["all","bizum","bank_transfer","cash","other"] as const;
export type PaymentMethodFilter=(typeof paymentMethods)[number];
export const paymentMethodLabels:Record<PaymentMethodFilter,string>={all:"Todos",bizum:"Bizum",bank_transfer:"Transferencia",cash:"Efectivo",other:"Otro"};

export function paymentRestaurant(value:PaymentRestaurantRelation){return Array.isArray(value)?value[0]??null:value}
function normalize(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function csvCell(value:unknown){let content=value===null||value===undefined?"":String(value);if(/^[=+\-@]/.test(content.trimStart()))content=`'${content}`;return`"${content.replaceAll('"','""')}"`}
export function isPaymentMethod(value:unknown):value is PaymentMethodFilter{return typeof value==="string"&&paymentMethods.includes(value as PaymentMethodFilter)}

export function safeLedgerDate(value:unknown,endOfDay=false){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const date=new Date(`${value}T${endOfDay?"23:59:59.999":"00:00:00.000"}Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?date:null}
export function safeLedgerMonth(value:unknown,now=new Date()){if(typeof value==="string"&&/^\d{4}-\d{2}$/.test(value)){const date=new Date(`${value}-01T00:00:00.000Z`);if(Number.isFinite(date.getTime())&&date.toISOString().slice(0,7)===value)return value}return now.toISOString().slice(0,7)}

export function filterLedgerPayments(rows:ManualPaymentRow[],filters:{q?:unknown;method?:unknown;from?:unknown;to?:unknown}){
  const q=typeof filters.q==="string"?normalize(filters.q).slice(0,100):"";const method=isPaymentMethod(filters.method)?filters.method:"all";const from=safeLedgerDate(filters.from)?.getTime()??null;const to=safeLedgerDate(filters.to,true)?.getTime()??null;
  return rows.filter(row=>isFinancialRestaurant(paymentRestaurant(row.restaurants)?.slug)).filter(row=>method==="all"||row.method===method).filter(row=>{const paidAt=new Date(row.paid_at).getTime();return Number.isFinite(paidAt)&&(from===null||paidAt>=from)&&(to===null||paidAt<=to)}).filter(row=>{if(!q)return true;const restaurant=paymentRestaurant(row.restaurants);return normalize(`${restaurant?.name??""} ${restaurant?.slug??""} ${paymentMethodLabels[row.method as PaymentMethodFilter]??row.method}`).includes(q)});
}

export function monthlyPaymentClosure(rows:ManualPaymentRow[],month:string){
  const selected=rows.filter(row=>row.paid_at.slice(0,7)===month);const totals:CurrencyTotals={};const methods:Record<string,number>={};
  for(const row of selected){totals[row.currency]=(totals[row.currency]??0)+row.amount_cents;methods[row.method]=(methods[row.method]??0)+1}
  return{month,count:selected.length,totals,formattedTotal:formatCurrencyTotals(totals),methods};
}

export function manualPaymentsCsv(rows:ManualPaymentRow[]){
  const headers=["fecha_pago","restaurante","slug","importe","moneda","método","cubierto_hasta"];
  const values=rows.map(row=>{const restaurant=paymentRestaurant(row.restaurants);return[row.paid_at,restaurant?.name??"Restaurante eliminado",restaurant?.slug??"",(row.amount_cents/100).toFixed(2),row.currency,paymentMethodLabels[row.method as PaymentMethodFilter]??"Otro",row.period_end]});
  return`\uFEFF${[headers,...values].map(row=>row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
