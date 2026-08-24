import { SignOut } from "@/components/dashboard/sign-out";

export function OperationalUnavailable() {
  return <main className="grid min-h-screen place-items-center p-6"><section className="max-w-md border border-stone-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">Menuly Comandas no está activo</h1><p className="mt-2 text-sm text-slate-600">El propietario debe activar el servicio de comandas.</p><div className="mt-5 flex justify-center"><SignOut /></div></section></main>;
}
