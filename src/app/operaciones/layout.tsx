import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operaciones",
  robots: { index: false, follow: false },
};

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-light min-h-screen bg-[#f4f1eb] text-slate-950">{children}</div>;
}
