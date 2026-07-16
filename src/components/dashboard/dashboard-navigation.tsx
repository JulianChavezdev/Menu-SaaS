"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export function DashboardNavigation({links}:{links:readonly (readonly [string,string])[]}){
  const pathname=usePathname();
  return <nav aria-label="Secciones del panel" className="mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-7 md:flex-col md:overflow-visible">
    {links.map(([label,href])=>{
      const active=href==="/dashboard"?pathname===href:pathname.startsWith(href);
      return <Link key={href} href={href} prefetch className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors ${active?"bg-white/15 font-semibold text-white":"text-slate-300 hover:bg-white/10 hover:text-white"}`}>{label}</Link>;
    })}
  </nav>;
}
