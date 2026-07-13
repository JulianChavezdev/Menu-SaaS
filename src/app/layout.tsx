import "./globals.css";
import {Toaster} from "sonner";
import type {Metadata,Viewport} from "next";
import {normalizedAppUrl} from "@/lib/app-url";

const baseUrl=normalizedAppUrl();
export const metadata:Metadata={
  metadataBase:new URL(baseUrl),
  title:{default:"Carta Video",template:"%s | Carta Video"},
  description:"Cartas digitales en vídeo para hostelería",
  applicationName:"Carta Video",
  robots:{index:true,follow:true},
  openGraph:{type:"website",siteName:"Carta Video",locale:"es_ES"},
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#090b18"};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}<Toaster richColors/></body></html>;
}
