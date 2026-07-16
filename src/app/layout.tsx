import "./globals.css";
import {Toaster} from "sonner";
import type {Metadata,Viewport} from "next";
import {normalizedAppUrl} from "@/lib/app-url";
import {SaasNavigationTracker} from "@/components/navigation/saas-navigation-tracker";

const baseUrl=normalizedAppUrl();
export const metadata:Metadata={
  metadataBase:new URL(baseUrl),
  title:{default:"Carta Video",template:"%s | Carta Video"},
  description:"Cartas digitales en vídeo para hostelería",
  applicationName:"Carta Video",
  alternates:{canonical:"/"},
  robots:{index:true,follow:true},
  openGraph:{type:"website",siteName:"Carta Video",locale:"es_ES"},
  twitter:{card:"summary",title:"Carta Video",description:"Cartas digitales en vídeo para hostelería"},
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#090b18"};

export default function Layout({children}:{children:React.ReactNode}){
  const mediaOrigins=["https://videos.pexels.com","https://res.cloudinary.com",process.env.NEXT_PUBLIC_SUPABASE_URL].filter((origin):origin is string=>Boolean(origin));
  return <html lang="es"><head>{mediaOrigins.map(origin=><link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous"/>)}</head><body><SaasNavigationTracker/>{children}<Toaster richColors/></body></html>;
}
