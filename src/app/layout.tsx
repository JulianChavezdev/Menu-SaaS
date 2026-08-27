import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";
import { normalizedAppUrl } from "@/lib/app-url";
import { SaasNavigationTracker } from "@/components/navigation/saas-navigation-tracker";
import {
  Barlow,
  Barlow_Condensed,
  Jost,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Righteous,
} from "next/font/google";

const baseUrl = normalizedAppUrl();
const noirSans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  style: ["normal"],
  display: "swap",
  variable: "--font-noir-sans",
});
const noirSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-noir-serif",
});
const streetSans = Barlow({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-street-sans",
});
const streetCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal"],
  display: "swap",
  variable: "--font-street-condensed",
});
const cozyDisplay = Righteous({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
  variable: "--font-cozy-display",
});
const cozySans = Nunito({
  subsets: ["latin"],
  weight: ["500", "700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-cozy-sans",
});
const tokyoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-tokyo-sans",
});
const tokyoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-tokyo-serif",
});
const marketingSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-marketing-sans",
});
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "Menuly", template: "%s | Menuly" },
  description: "Cartas digitales en vídeo para hostelería",
  applicationName: "Menuly",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "Menuly", locale: "es_ES" },
  twitter: {
    card: "summary",
    title: "Menuly",
    description: "Cartas digitales en vídeo para hostelería",
  },
  icons: { icon: "/brand/menuly-mark.png", apple: "/brand/menuly-mark.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0C1F30",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const mediaOrigins = [
    "https://videos.pexels.com",
    "https://res.cloudinary.com",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ].filter((origin): origin is string => Boolean(origin));
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${noirSans.variable} ${noirSerif.variable} ${streetSans.variable} ${streetCondensed.variable} ${cozyDisplay.variable} ${cozySans.variable} ${tokyoSans.variable} ${tokyoSerif.variable} ${marketingSans.variable}`}
    >
      <head>
        {mediaOrigins.map((origin) => (
          <link
            key={origin}
            rel="preconnect"
            href={origin}
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>
        <SaasNavigationTracker />
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
