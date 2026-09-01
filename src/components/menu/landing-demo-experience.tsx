import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Languages,
  List,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const highlights = [
  {
    icon: ChevronDown,
    title: "Desliza para descubrir",
    text: "Baja para recorrer los platos de una categoría, como en un feed de vídeo.",
  },
  {
    icon: Sparkles,
    title: "Cambia de categoría",
    text: "Desliza lateralmente o usa las categorías superiores para saltar entre secciones.",
  },
  {
    icon: List,
    title: "Consulta cada detalle",
    text: "Abre la descripción para ver ingredientes, alérgenos y recomendaciones.",
  },
  {
    icon: ShoppingBag,
    title: "Prepara tu selección",
    text: "Añade platos al carrito y revisa cómodamente lo que te apetece pedir.",
  },
  {
    icon: Languages,
    title: "Carta en dos idiomas",
    text: "Prueba el cambio automático entre español e inglés desde el menú.",
  },
] as const;

export function LandingDemoExperience({
  slug,
  restaurantName,
}: {
  slug: string;
  restaurantName: string;
}) {
  return (
    <main className="h-svh overflow-hidden bg-[#0f0f0f] text-[#f5f0eb]">
      <div className="h-full md:grid md:grid-cols-[minmax(340px,402px)_minmax(0,440px)] md:items-center md:justify-center md:gap-8 md:px-6 md:py-6 lg:gap-14 lg:px-10">
        <section className="h-full md:h-[min(820px,calc(100svh-48px))] md:min-h-[640px] md:overflow-hidden md:rounded-[32px] md:border md:border-[#d4943a]/35 md:bg-black md:shadow-[0_28px_80px_rgba(0,0,0,.55),0_0_0_6px_rgba(255,255,255,.025)]">
          <iframe
            src={`/r/${slug}?preview=embed`}
            title={`Demo interactiva de ${restaurantName}`}
            allow="autoplay; fullscreen"
            loading="eager"
            className="h-full w-full border-0"
          />
        </section>

        <aside className="hidden min-w-0 md:block">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/brand/menuly-mark-dark.png"
              alt="Menuly"
              width={42}
              height={42}
              className="size-10 object-contain"
            />
            <span className="font-[family-name:var(--font-marketing-sans)] text-xl font-extrabold">
              menuly
            </span>
          </Link>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[.2em] text-[#d4943a]">
            Demo interactiva
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-marketing-sans)] text-[clamp(2.25rem,4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-.045em]">
            Prueba la carta
            <span className="block text-[#d4943a]">como un cliente.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#a89b8e] lg:text-base lg:leading-7">
            Todo lo que ves a la izquierda es funcional. Explora los vídeos,
            abre un plato y añade productos al carrito.
          </p>

          <div className="mt-6 grid gap-2.5 lg:mt-8 lg:gap-3">
            {highlights.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="group flex items-start gap-3 rounded-[14px] border border-white/[.07] bg-white/[.035] px-3.5 py-3 transition duration-300 hover:border-[#d4943a]/35 hover:bg-white/[.055]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#d4943a]/12 text-[#d4943a]">
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-bold">
                    <span className="mr-1.5 text-[#d4943a]">0{index + 1}</span>
                    {title}
                  </h2>
                  <p className="mt-0.5 text-[11px] leading-[17px] text-[#91867c] lg:text-xs">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/register?plan=carta"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#d4943a] px-6 text-sm font-bold text-[#0c0a08] shadow-[0_0_24px_rgba(212,148,58,.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e3a64d] lg:mt-8"
          >
            Crear mi carta <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
