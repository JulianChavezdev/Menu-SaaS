const MONTHS=6;

function monthKey(date:Date){return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`}

export function platformGrowth(createdAt:string[],capacity:number,now=new Date()){
  const validDates=createdAt.map(value=>new Date(value)).filter(date=>!Number.isNaN(date.getTime())&&date<=now);
  const daysAgo=(days:number)=>new Date(now.getTime()-days*86_400_000);
  const last30=validDates.filter(date=>date>=daysAgo(30)).length;
  const previous30=validDates.filter(date=>date>=daysAgo(60)&&date<daysAgo(30)).length;
  const last90=validDates.filter(date=>date>=daysAgo(90)).length;
  const monthlyRate=Math.round(last90/3*10)/10;
  const remaining=Math.max(0,capacity-validDates.length);
  const monthsToCapacity=remaining===0?0:monthlyRate>0?Math.ceil(remaining/monthlyRate*10)/10:null;
  const projectedDate=monthsToCapacity===null?null:new Date(now.getTime()+monthsToCapacity*30.4375*86_400_000).toISOString();
  const months=Array.from({length:MONTHS},(_,index)=>{
    const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-(MONTHS-1-index),1));
    const key=monthKey(date);
    return{key,label:new Intl.DateTimeFormat("es-ES",{month:"short",timeZone:"UTC"}).format(date).replace(".",""),added:validDates.filter(item=>monthKey(item)===key).length};
  });
  return{total:validDates.length,last30,previous30,monthlyRate,remaining,monthsToCapacity,projectedDate,months,trend:last30-previous30};
}
