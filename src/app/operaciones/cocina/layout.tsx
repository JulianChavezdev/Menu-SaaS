import type { Metadata } from "next";
import { OperationalAppGuard } from "@/components/pwa/operational-app-guard";

export const metadata: Metadata = {
  title: "Cocina",
  applicationName: "Menuly Cocina",
  manifest: "/manifests/cocina.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cocina",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/brand/menuly-mark-dark.png?v=2" },
  robots: { index: false, follow: false },
};

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return <><OperationalAppGuard app="cocina" />{children}</>;
}
