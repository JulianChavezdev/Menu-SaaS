import Link from "next/link";
import type {Metadata} from "next";
import {requireSuperadmin} from "@/lib/superadmin";
import {SignOut} from "@/components/dashboard/sign-out";
import {BrandLogo} from "@/components/brand/brand-logo";
import {isLocalDevelopmentFailure} from "@/lib/platform-alerts";

export const metadata:Metadata={title:"Superadmin",robots:{index:false,follow:false}};

export default async function SuperadminLayout({children}:{children:React.ReactNode}){
  const{admin}=await requireSuperadmin();const since=new Date(Date.now()-7*86_400_000).toISOString();const[{count:feedbackCount},{data:recentAlerts}]=await Promise.all([admin.from("restaurant_feedback").select("id",{count:"exact",head:true}).eq("status","new"),admin.from("superadmin_audit_log").select("action,details").like("action","alert.%").gte("created_at",since)]);const alertCount=(recentAlerts??[]).filter(alert=>alert.action!=="alert.failure"||!isLocalDevelopmentFailure(alert.details)).length;
  return <div className="saas-light menuly-app min-h-screen overflow-x-hidden bg-[#f4f1eb] text-slate-950"><header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 shadow-sm"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6"><Link href="/superadmin" aria-label="Menuly · Superadmin" className="flex items-center gap-3"><BrandLogo className="w-[118px]"/><span className="border-l border-stone-300 pl-3 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Superadmin</span></Link><nav className="grid grid-cols-2 items-center justify-between gap-1 text-xs sm:flex sm:flex-wrap sm:justify-end sm:gap-1 sm:text-sm"><Nav href="/superadmin" label="Restaurantes"/><Nav href="/superadmin/alerts" label={`Alertas${alertCount?` (${alertCount})`:""}`}/><Nav href="/superadmin/analytics" label="Analíticas"/><Nav href="/superadmin/finance" label="Finanzas"/><Nav href="/superadmin/activity" label="Actividad"/><Nav href="/superadmin/feedback" label={`Sugerencias${feedbackCount?` (${feedbackCount})`:""}`}/><Nav href="/superadmin/trash" label="Papelera"/><Nav href="/dashboard" label="Panel normal"/><SignOut/></nav></div></header>{children}</div>;
}

function Nav({href,label}:{href:string;label:string}){return <Link href={href} className="border-l-2 border-transparent px-2 py-2 text-center text-slate-600 hover:border-orange-500 hover:bg-orange-50 hover:text-slate-950 sm:px-3">{label}</Link>}
