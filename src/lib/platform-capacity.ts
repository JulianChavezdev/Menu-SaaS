export const DEFAULT_RESTAURANT_CAPACITY=25;

export function restaurantCapacity(value:string|undefined){
  const parsed=Number(value);
  return Number.isInteger(parsed)&&parsed>0&&parsed<=100_000?parsed:DEFAULT_RESTAURANT_CAPACITY;
}

export function capacitySnapshot(current:number,capacity:number){
  const safeCurrent=Math.max(0,Math.floor(current));
  const safeCapacity=Math.max(1,Math.floor(capacity));
  const rawPercent=(safeCurrent/safeCapacity)*100;
  return{
    current:safeCurrent,
    capacity:safeCapacity,
    percent:Math.min(100,Math.round(rawPercent)),
    remaining:Math.max(0,safeCapacity-safeCurrent),
    exceededBy:Math.max(0,safeCurrent-safeCapacity),
    level:rawPercent>=100?"critical" as const:rawPercent>=80?"warning" as const:"healthy" as const,
  };
}
