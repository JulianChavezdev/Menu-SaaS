import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comandero",
  applicationName: "Menuly Comandero",
  manifest: "/manifests/comandero.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Comandero",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/brand/menuly-mark.png" },
  robots: { index: false, follow: false },
};

export default function ComanderoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
