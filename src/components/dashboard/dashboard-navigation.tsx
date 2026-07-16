"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export function DashboardNavigation({links}:{links:readonly (readonly [string,string])[]}){
  const pathname=usePathname();
  return <nav aria-label="Secciones del panel" className="mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-7 md:flex-col md:overflow-visible">
    {links.map(([label,href])=>{
      const active=href==="/dashboard"?pathname===href:pathname.startsWith(href);
      return <Link key={href} href={href} prefetch className={`whitespace-nowrap border-l-4 px-3 py-2.5 text-sm transition-colors ${active?"border-orange-600 bg-orange-50 font-bold text-orange-950":"border-transparent text-slate-600 hover:bg-stone-100 hover:text-slate-950"}`}>{label}</Link>;
    })}
  </nav>;
}
