import Link from "next/link";
import type {Metadata} from "next";
import {ShieldCheck} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {SignOut} from "@/components/dashboard/sign-out";

export const metadata:Metadata={title:"Superadmin",robots:{index:false,follow:false}};

export default async function SuperadminLayout({children}:{children:React.ReactNode}){
  await requireSuperadmin();
  return <div className="min-h-screen overflow-x-hidden bg-[#070912]"><header className="sticky top-0 z-40 border-b border-white/10 bg-[#070912]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6"><Link href="/superadmin" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><ShieldCheck size={19}/></span>Superadmin</Link><nav className="grid grid-cols-2 items-center justify-between gap-1 text-xs sm:flex sm:gap-2 sm:text-sm"><Link href="/superadmin" className="rounded-lg px-2 py-2 text-center hover:bg-white/10 sm:px-3">Restaurantes</Link><Link href="/superadmin/finance" className="rounded-lg px-2 py-2 text-center hover:bg-white/10 sm:px-3">Finanzas</Link><Link href="/superadmin/activity" className="rounded-lg px-2 py-2 text-center hover:bg-white/10 sm:px-3">Actividad</Link><Link href="/superadmin/trash" className="rounded-lg px-2 py-2 text-center hover:bg-white/10 sm:px-3">Papelera</Link><Link href="/dashboard" className="rounded-lg px-2 py-2 text-center hover:bg-white/10 sm:px-3">Panel normal</Link><SignOut/></nav></div></header>{children}</div>;
}
