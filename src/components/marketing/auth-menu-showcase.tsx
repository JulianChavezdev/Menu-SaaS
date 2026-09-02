import Image from "next/image";

const cards = [
  {
    src: "/landing/figma/asset-3.png",
    title: "Pizza Margarita",
    price: "8,90 €",
    className: "left-[8%] top-[13%] -rotate-[15deg]",
  },
  {
    src: "/landing/figma/dish-1.jpg",
    title: "Alcachofas con jamón",
    price: "12,90 €",
    className: "left-1/2 top-[5%] z-10 -translate-x-1/2",
  },
  {
    src: "/landing/figma/asset-7.png",
    title: "Hamburguesa Nebulosa",
    price: "10,50 €",
    className: "right-[8%] top-[13%] rotate-[15deg]",
  },
];

export function AuthMenuShowcase() {
  return (
    <aside
      aria-label="Ejemplo de carta digital Menuly"
      className="relative hidden h-full min-h-dvh overflow-hidden bg-[#0f0f0f] min-[900px]:block"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(212,148,58,.13),transparent_42%)]" />
      <div className="absolute left-1/2 top-1/2 h-[min(72vh,700px)] w-[min(49vw,820px)] -translate-x-1/2 -translate-y-1/2">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className={`absolute aspect-[9/16] h-[88%] overflow-hidden rounded-[24px] border bg-[#171717] shadow-[0_28px_80px_rgba(0,0,0,.48)] ${index === 1 ? "border-[#d4943a]/55" : "border-white/10"} ${card.className}`}
          >
            <Image
              src={card.src}
              alt=""
              fill
              priority
              sizes="(min-width: 900px) 28vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/40" />
            <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[10px] text-white">
              <span className="grid size-7 place-items-center rounded-lg border border-white/20 bg-black/30">←</span>
              <b>BISTRO NUBE</b>
              <span className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5">EN</span>
            </div>
            <div className="absolute inset-x-4 bottom-5 text-white">
              <div className="flex items-end justify-between gap-3">
                <strong className="max-w-[72%] text-base leading-tight">{card.title}</strong>
                <strong className="shrink-0 text-sm text-[#ffd43b]">{card.price}</strong>
              </div>
              <p className="mt-1 text-[10px] text-white/65">Descripción</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
