"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "#producto", label: "Producto" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQs" },
  { href: "#contacto", label: "Contacto" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#0f0f0f]/95 font-[family-name:var(--font-marketing-sans)] text-[#f5f0eb] backdrop-blur-xl">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-4 px-5 sm:px-8 lg:px-12 min-[1600px]:h-[96px] min-[1600px]:max-w-[1920px] min-[1600px]:px-[76px]"
      >
        <Link
          href="#inicio"
          aria-label="Menuly · Inicio"
          className="text-[22px] font-extrabold leading-[33px] tracking-[-.55px] min-[1600px]:text-[30px] min-[1600px]:leading-[45px] min-[1600px]:tracking-[-.75px]"
        >
          menuly
        </Link>
        <div className="mx-auto hidden items-center gap-6 lg:flex min-[1600px]:gap-10">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[16px] font-semibold leading-[25.6px] text-[#a09890] transition-colors hover:text-[#f5f0eb] min-[1600px]:text-[21px] min-[1600px]:leading-8"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-5 sm:flex min-[1600px]:gap-8">
          <Link
            href="/login"
            className="px-2 py-2 text-[14px] font-semibold leading-5 text-[#f5f0eb] transition-colors hover:text-[#d4943a] min-[1600px]:text-[18px] min-[1600px]:leading-7"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-2 rounded-[24px] bg-[#f5a623] px-5 text-[14px] font-bold text-[#0b0b0c] shadow-[0_0_18px_rgba(212,148,58,.28)] transition hover:-translate-y-0.5 hover:bg-[#f8b84a] min-[1600px]:h-[62px] min-[1600px]:rounded-[36px] min-[1600px]:px-8 min-[1600px]:text-[18px]"
          >
            Crear mi carta
            <ArrowRight size={15} />
          </Link>
        </div>
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto grid size-10 shrink-0 place-items-center rounded-[12px] border border-white/15 text-[#f5f0eb] lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/[.06] bg-[#111112] px-5 pb-5 pt-3 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-4 py-3 text-sm text-[#a09890] hover:bg-white/[.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mx-auto mt-3 grid max-w-7xl grid-cols-2 gap-2 sm:hidden">
            <Link
              href="/login"
              className="rounded-[24px] border border-white/15 px-4 py-3 text-center text-sm font-semibold"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-[24px] bg-[#f5a623] px-4 py-3 text-center text-sm font-bold text-[#0b0b0c]"
            >
              Crear carta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
