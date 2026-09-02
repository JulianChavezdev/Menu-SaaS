"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export function DashboardNavigation({links}:{links:readonly (readonly [string,string])[]}){
  const pathname=usePathname();
  return <div className="relative min-w-0">
    <nav aria-label="Secciones del panel" className="mt-4 flex gap-2 overflow-x-auto px-3 pb-2 md:mx-0 md:mt-7 md:flex-col md:overflow-visible md:px-0">
      {links.map(([label,href])=>{
        const active=href==="/dashboard"?pathname===href:pathname.startsWith(href);
        const className=`whitespace-nowrap border-l-4 px-3 py-2.5 text-sm transition-colors ${active?"border-orange-600 bg-orange-50 font-bold text-orange-950":"border-transparent text-slate-600 hover:bg-stone-100 hover:text-slate-950"}`;
        return href.startsWith("/operaciones/")
          ? <a key={href} href={href} className={className}>{label}</a>
          : <Link key={href} href={href} prefetch className={className}>{label}</Link>;
      })}
    </nav>
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--menuly-surface)] to-transparent md:hidden" />
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--menuly-surface)] to-transparent md:hidden" />
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-7 bg-gradient-to-b from-transparent to-[var(--menuly-surface)]/80 md:block" />
  </div>;
}
