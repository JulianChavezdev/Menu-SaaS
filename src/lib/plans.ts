export const PLAN_LIMITS={carta:{restaurants:1,products:100}} as const;
export function canCreateProduct(currentCount:number,plan:keyof typeof PLAN_LIMITS="carta"){return currentCount<PLAN_LIMITS[plan].products}
