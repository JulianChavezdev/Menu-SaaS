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
  const mediaOrigin="https://videos.pexels.com";
  return <html lang="es"><head><link rel="preconnect" href={mediaOrigin} crossOrigin="anonymous"/><link rel="dns-prefetch" href={mediaOrigin}/></head><body><SaasNavigationTracker/>{children}<Toaster richColors/></body></html>;
}
