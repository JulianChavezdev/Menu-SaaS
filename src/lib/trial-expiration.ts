export const TRIAL_DAYS=7;

export function trialIsExpired(status:string|undefined,periodEnd:string|null|undefined,now=new Date()){
  if(status!=="trialing"||!periodEnd)return false;
  const end=new Date(periodEnd);
  return !Number.isNaN(end.getTime())&&end.getTime()<=now.getTime();
}

export function trialDaysRemaining(periodEnd:string|null|undefined,now=new Date()){
  if(!periodEnd)return null;
  const end=new Date(periodEnd);
  if(Number.isNaN(end.getTime()))return null;
  return Math.max(0,Math.ceil((end.getTime()-now.getTime())/(24*60*60*1000)));
}
