export const PLAN_LIMITS={trial:{restaurants:1,products:3,categories:5},carta:{restaurants:1,products:100,categories:Number.POSITIVE_INFINITY}} as const;
export type PlanKey=keyof typeof PLAN_LIMITS;
export function planForStatus(status:string):PlanKey{return status==="active"?"carta":"trial"}
export function canCreateProduct(currentCount:number,plan:PlanKey="carta"){return currentCount<PLAN_LIMITS[plan].products}
export function canCreateCategory(currentCount:number,plan:PlanKey="carta"){return currentCount<PLAN_LIMITS[plan].categories}
