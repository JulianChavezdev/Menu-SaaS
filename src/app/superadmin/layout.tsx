import Link from "next/link";
import type {Metadata} from "next";
import {ShieldCheck} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {SignOut} from "@/components/dashboard/sign-out";

export const metadata:Metadata={title:"Superadmin",robots:{index:false,follow:false}};

export default async function SuperadminLayout({children}:{children:React.ReactNode}){
  await requireSuperadmin();
  return <div className="min-h-screen bg-[#070912]"><header className="sticky top-0 z-40 border-b border-white/10 bg-[#070912]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6"><Link href="/superadmin" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><ShieldCheck size={19}/></span>Superadmin</Link><nav className="flex items-center gap-2 text-sm"><Link href="/superadmin" className="rounded-lg px-3 py-2 hover:bg-white/10">Restaurantes</Link><Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-white/10">Panel normal</Link><SignOut/></nav></div></header>{children}</div>;
}
