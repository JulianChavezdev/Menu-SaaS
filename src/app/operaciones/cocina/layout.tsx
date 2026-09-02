import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cocina",
  applicationName: "Menuly Cocina",
  manifest: "/manifests/cocina.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cocina",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/brand/menuly-mark.png" },
  robots: { index: false, follow: false },
};

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
