export type ManualBillingState="none"|"current"|"due_soon"|"overdue";

export function manualBillingState(periodEnd:string|null|undefined,now=new Date()):ManualBillingState{
  if(!periodEnd)return "none";
  const end=new Date(periodEnd);
  if(Number.isNaN(end.getTime()))return "none";
  const remaining=end.getTime()-now.getTime();
  if(remaining<0)return "overdue";
  if(remaining<=7*24*60*60*1000)return "due_soon";
  return "current";
}

export function defaultManualPeriodEnd(now=new Date()){
  const end=new Date(now);
  end.setUTCMonth(end.getUTCMonth()+1);
  return end.toISOString().slice(0,10);
}
