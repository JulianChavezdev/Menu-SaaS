"use client";

export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <html lang="es"><body className="bg-[#f4f1eb] text-slate-950"><main className="grid min-h-dvh place-items-center p-6 text-center"><section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-800">Error inesperado</p><h1 className="mt-3 text-2xl font-bold">No pudimos cargar la aplicación</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">Tus datos no se han perdido. Reintenta la operación o vuelve a abrir la página.</p><button onClick={reset} className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold">Reintentar</button></section></main></body></html>;
}
