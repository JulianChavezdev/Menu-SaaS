import Link from "next/link";
import type {ReactNode} from "react";
import {ArrowLeft} from "lucide-react";
import {LEGAL_UPDATED_AT, legalLinks, type LegalIdentity} from "@/lib/legal";

export function LegalPage({title, summary, identity, children}:{title:string;summary:string;identity:LegalIdentity;children:ReactNode}) {
  return <main className="min-h-screen bg-stone-50 text-stone-950">
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-orange-800"><ArrowLeft size={16}/>Menuly</Link>
        <span className="text-xs text-stone-500">Actualizado: {LEGAL_UPDATED_AT}</span>
      </div>
    </header>
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-800">Información jurídica</p>
      <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600">{summary}</p>
      <div className="mt-8 border-y border-stone-200 bg-white px-4 py-4 text-sm leading-6 sm:px-5">
        <strong>{identity.name}</strong><br/>
        NIF/CIF: {identity.taxId}<br/>
        Domicilio: {identity.address}<br/>
        Contacto: <a className="underline decoration-stone-300 underline-offset-4" href={`mailto:${identity.email}`}>{identity.email}</a>{identity.phone ? ` · ${identity.phone}` : ""}
      </div>
      <div className="legal-copy mt-10 space-y-9 text-[15px] leading-7 text-stone-700">{children}</div>
    </article>
    <footer className="border-t border-stone-200 bg-white px-4 py-7 sm:px-6">
      <nav className="mx-auto flex max-w-4xl flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600" aria-label="Documentos legales">
        {legalLinks.map(link=><Link key={link.href} href={link.href} className="hover:text-orange-800">{link.label}</Link>)}
      </nav>
    </footer>
  </main>;
}

export function LegalSection({title, children}:{title:string;children:ReactNode}) {
  return <section><h2 className="mb-3 font-serif text-2xl font-bold text-stone-950">{title}</h2>{children}</section>;
}
