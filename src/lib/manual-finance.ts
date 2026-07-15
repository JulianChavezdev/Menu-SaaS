export type FinancePayment={amount_cents:number;currency:string;paid_at:string};
export type CurrencyTotals=Record<string,number>;
export type FinanceMonth={key:string;label:string;count:number;totals:CurrencyTotals};
export const SHOWCASE_RESTAURANT_SLUG="bistro-nube";
export function isFinancialRestaurant(slug:string|null|undefined){return Boolean(slug)&&slug!==SHOWCASE_RESTAURANT_SLUG}

function monthKey(date:Date){return`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`}
function add(totals:CurrencyTotals,currency:string,amount:number){totals[currency]=(totals[currency]??0)+amount}

export function manualFinanceSnapshot(payments:FinancePayment[],now=new Date()){
  const months:FinanceMonth[]=[];
  for(let offset=5;offset>=0;offset--){const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset,1));months.push({key:monthKey(date),label:new Intl.DateTimeFormat("es-ES",{month:"short",timeZone:"UTC"}).format(date).replace(".",""),count:0,totals:{}})}
  const byMonth=new Map(months.map(month=>[month.key,month]));const allTime:CurrencyTotals={};
  for(const payment of payments){const date=new Date(payment.paid_at);if(!Number.isFinite(date.getTime())||!Number.isFinite(payment.amount_cents)||payment.amount_cents<=0)continue;const currency=/^[A-Z]{3}$/.test(payment.currency)?payment.currency:"EUR";add(allTime,currency,payment.amount_cents);const month=byMonth.get(monthKey(date));if(month){month.count++;add(month.totals,currency,payment.amount_cents)}}
  return{months,current:months.at(-1)!,previous:months.at(-2)!,allTime,totalPayments:payments.length};
}

export function formatCurrencyTotals(totals:CurrencyTotals){
  const entries=Object.entries(totals).filter(([,amount])=>amount>0).sort(([a],[b])=>a.localeCompare(b));
  if(!entries.length)return"0,00 €";
  return entries.map(([currency,cents])=>new Intl.NumberFormat("es-ES",{style:"currency",currency}).format(cents/100)).join(" · ");
}
