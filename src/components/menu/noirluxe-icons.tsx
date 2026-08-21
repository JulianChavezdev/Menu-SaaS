import Image from "next/image";

export function NoirLuxeAddIcon({filled=true}:{filled?:boolean}){
  return <span aria-hidden="true" className="relative block size-11 overflow-hidden"><Image src={filled?"/themes/noirluxe/plus-light.svg":"/themes/noirluxe/basket-handle.svg"} alt="" width={33} height={33} className="absolute inset-[12.5%] size-[75%]"/><Image src={filled?"/themes/noirluxe/basket-main.svg":"/themes/noirluxe/basket-heart.svg"} alt="" width={17} height={17} className="absolute inset-[31.25%] size-[37.5%]"/></span>;
}

export function NoirLuxeBasketIcon(){
  return <span aria-hidden="true" className="relative block size-8 overflow-hidden"><Image src="/themes/noirluxe/plus-dark.svg" alt="" width={23} height={22} className="absolute bottom-[8.33%] left-[12.5%] h-[62.5%] w-[66.67%]"/><Image src="/themes/noirluxe/add-filled.svg" alt="" width={13} height={12} className="absolute left-[29.17%] top-[8.33%] h-[31.25%] w-[33.33%]"/><Image src="/themes/noirluxe/add-outline.svg" alt="" width={11} height={10} className="absolute bottom-[8.33%] right-[12.5%] h-[25%] w-[29.17%]"/></span>;
}

export function NoirLuxeHamburgerIcon(){
  return <span aria-hidden="true" className="flex w-5 flex-col gap-1"><span className="h-[3px] bg-[#C9A96E]"/><span className="h-[3px] bg-[#C9A96E]"/><span className="h-[3px] bg-[#C9A96E]"/></span>;
}

export function NoirLuxeProgress({active,total}:{active:number;total:number}){
  const current=Math.min(2,Math.floor(active/Math.max(1,total)*3));
  return <span aria-hidden="true" className="flex items-center gap-1">{[0,1,2].map(index=><span key={index} className={`h-1 bg-[#F0E9DB] ${index===current?"w-7 bg-[#C9A96E]":"w-4"}`}/>)}</span>;
}
