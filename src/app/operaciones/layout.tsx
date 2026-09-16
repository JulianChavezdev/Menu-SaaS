import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operaciones",
  robots: { index: false, follow: false },
};

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <div className="internal-green min-h-screen">{children}</div>;
}
