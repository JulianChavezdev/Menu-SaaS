"use client";

import Link from "next/link";

export default function SuperadminError({reset}:{error:Error;reset:()=>void}){
  return <main className="grid min-h-[70vh] place-items-center p-6 text-center"><section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7"><h1 className="text-2xl font-bold">No pudimos cargar el superadmin</h1><p className="mt-3 text-sm text-slate-600">La operación no se ha confirmado. Reintenta antes de realizar otro cambio.</p><div className="mt-6 grid gap-2"><button onClick={reset} className="rounded-xl bg-orange-600 px-4 py-3 font-bold">Reintentar</button><Link href="/superadmin" className="rounded-xl border border-stone-200 px-4 py-3 text-sm">Volver al listado</Link></div></section></main>;
}
