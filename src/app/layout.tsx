import "./globals.css";import { Toaster } from "sonner";import type { Metadata } from "next";
export const metadata: Metadata={title:"Carta Video",description:"Cartas digitales en vídeo para hostelería"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}<Toaster richColors/></body></html>}
