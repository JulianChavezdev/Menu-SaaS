export type OrderAnalyticsRow={status:string;subtotal_cents:number;created_at:string;accepted_at?:string|null;delivered_at?:string|null};

export function summarizeOrderAnalytics(rows:OrderAnalyticsRow[]){
  const submitted=rows.length;
  const accepted=rows.filter(row=>Boolean(row.accepted_at)||["accepted","preparing","ready","delivered"].includes(row.status)).length;
  const deliveredRows=rows.filter(row=>row.status==="delivered");
  const delivered=deliveredRows.length;
  const rejected=rows.filter(row=>row.status==="rejected").length;
  const cancelled=rows.filter(row=>row.status==="cancelled").length;
  const deliveredCents=deliveredRows.reduce((total,row)=>total+Number(row.subtotal_cents||0),0);
  const preparationMinutes=deliveredRows.flatMap(row=>row.delivered_at?[Math.max(0,(new Date(row.delivered_at).getTime()-new Date(row.created_at).getTime())/60_000)]:[]);
  return{submitted,accepted,delivered,rejected,cancelled,deliveredCents,averageTicketCents:delivered?Math.round(deliveredCents/delivered):0,acceptanceRate:submitted?Math.round(accepted/submitted*100):0,deliveryRate:submitted?Math.round(delivered/submitted*100):0,averageDeliveryMinutes:preparationMinutes.length?Math.round(preparationMinutes.reduce((sum,value)=>sum+value,0)/preparationMinutes.length):0};
}
