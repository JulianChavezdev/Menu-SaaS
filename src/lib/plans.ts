export const PLAN_LIMITS={trial:{restaurants:1,products:5,productsPerCategory:1,categories:5},carta:{restaurants:1,products:100,productsPerCategory:Number.POSITIVE_INFINITY,categories:Number.POSITIVE_INFINITY}} as const;
export type PlanKey=keyof typeof PLAN_LIMITS;
export function planForStatus(status:string):PlanKey{return status==="active"?"carta":"trial"}
export function canCreateProduct(currentCount:number,plan:PlanKey="carta",currentCategoryCount=0){const limits=PLAN_LIMITS[plan];return currentCount<limits.products&&currentCategoryCount<limits.productsPerCategory}
export function canCreateCategory(currentCount:number,plan:PlanKey="carta"){return currentCount<PLAN_LIMITS[plan].categories}
