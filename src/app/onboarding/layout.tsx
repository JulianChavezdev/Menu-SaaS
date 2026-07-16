import type {Metadata} from "next";

export const metadata:Metadata={title:"Primeros pasos",robots:{index:false,follow:false}};

export default function OnboardingLayout({children}:{children:React.ReactNode}){return <div className="saas-light min-h-dvh bg-[#f4f1eb] text-slate-950">{children}</div>}
