import Link from "next/link";
import type {Metadata} from "next";
import {requireSuperadmin} from "@/lib/superadmin";
import {SignOut} from "@/components/dashboard/sign-out";
import {BrandLogo} from "@/components/brand/brand-logo";

export const metadata:Metadata={title:"Superadmin",robots:{index:false,follow:false}};

export default async function SuperadminLayout({children}:{children:React.ReactNode}){
  const{admin}=await requireSuperadmin();const{count:feedbackCount}=await admin.from("restaurant_feedback").select("id",{count:"exact",head:true}).eq("status","new");
  return <div className="saas-light min-h-screen overflow-x-hidden bg-[#f4f1eb] text-slate-950"><header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 shadow-sm"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6"><Link href="/superadmin" aria-label="Menuly · Superadmin" className="flex items-center gap-3"><BrandLogo className="w-[118px]"/><span className="border-l border-stone-300 pl-3 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Superadmin</span></Link><nav className="grid grid-cols-2 items-center justify-between gap-1 text-xs sm:flex sm:flex-wrap sm:justify-end sm:gap-1 sm:text-sm"><Nav href="/superadmin" label="Restaurantes"/><Nav href="/superadmin/analytics" label="Analíticas"/><Nav href="/superadmin/finance" label="Finanzas"/><Nav href="/superadmin/activity" label="Actividad"/><Nav href="/superadmin/feedback" label={`Sugerencias${feedbackCount?` (${feedbackCount})`:""}`}/><Nav href="/superadmin/trash" label="Papelera"/><Nav href="/dashboard" label="Panel normal"/><SignOut/></nav></div></header>{children}</div>;
}

function Nav({href,label}:{href:string;label:string}){return <Link href={href} className="border-l-2 border-transparent px-2 py-2 text-center text-slate-600 hover:border-orange-500 hover:bg-orange-50 hover:text-slate-950 sm:px-3">{label}</Link>}
