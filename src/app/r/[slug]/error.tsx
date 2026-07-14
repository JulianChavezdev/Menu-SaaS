"use client";

import Link from "next/link";
import {RefreshCcw,TriangleAlert} from "lucide-react";

export default function PublicMenuError({reset}:{reset:()=>void}){return <main className="grid min-h-dvh place-items-center bg-slate-950 p-5 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.05] p-7 text-center shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300"><TriangleAlert size={27}/></span><h1 className="mt-5 text-2xl font-bold">No pudimos cargar la carta</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">Puede ser un problema temporal de conexión. Tus datos no se han perdido.</p><div className="mt-6 grid gap-2"><button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold"><RefreshCcw size={17}/>Reintentar</button><Link href="/" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">Volver al inicio</Link></div></section></main>}
