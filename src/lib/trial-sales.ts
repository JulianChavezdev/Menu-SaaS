import {signupPlan,type SignupPlanId} from "./signup-plans";

export type TrialSalesInput={status:string;planInterest:string;periodEnd:string|null;isSuspended:boolean};

export function trialSalesSnapshot(rows:TrialSalesInput[],now=new Date()){
  const trials=rows.filter(row=>row.status==="trialing"&&!row.isSuspended);
  const active=rows.filter(row=>row.status==="active"&&!row.isSuspended).length;
  const lost=rows.filter(row=>["past_due","canceled"].includes(row.status)||row.isSuspended).length;
  const expiringSoon=trials.filter(row=>{
    if(!row.periodEnd)return false;
    const remaining=new Date(row.periodEnd).getTime()-now.getTime();
    return remaining>=0&&remaining<=7*86_400_000;
  }).length;
  const decided=active+lost;
  const interests=rows.reduce<Record<SignupPlanId,number>>((totals,row)=>{
    totals[signupPlan(row.planInterest)]++;
    return totals;
  },{carta:0,pedidos:0,configuracion:0});
  return{registered:rows.length,trials:trials.length,expiringSoon,active,lost,conversionRate:decided?Math.round(active/decided*100):0,interests};
}

