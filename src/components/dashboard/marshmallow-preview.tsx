import Image from "next/image";
import { MarshmallowIcon } from "@/components/menu/marshmallow-icons";

export function MarshmallowPreview({
  restaurantName,
  large = false,
}: {
  restaurantName: string;
  large?: boolean;
}) {
  return (
    <div
      data-dashboard-preview
      data-template="marshmallow"
      className={`relative mx-auto w-full overflow-hidden bg-[#fff9f0] text-[#493332] ${large ? "h-[min(70dvh,620px)] max-w-[350px]" : "aspect-[9/12]"}`}
      style={{ fontFamily: "var(--font-cozy-sans)" }}
    >
      <div className="flex items-center justify-between border-b border-[#e5d8cb] px-[7%] py-[5%]">
        <span className="flex items-center gap-1.5">
          <MarshmallowIcon name="scoop" width={19} height={19} />
          <span className="max-w-[130px] truncate font-[family-name:var(--font-noir-serif)] text-xs">
            {restaurantName}
          </span>
        </span>
        <MarshmallowIcon name="bag" width={18} height={18} />
      </div>
      <div className="relative px-[7%] py-[9%]">
        <p className="relative z-10 font-[family-name:var(--font-noir-serif)] text-[clamp(19px,2.2vw,32px)] leading-[1.05] tracking-tight">
          La vida pide
          <br />
          <em className="text-[#99435b]">algo dulce.</em>
        </p>
        <span className="relative z-10 mt-4 inline-block rounded-lg border border-[#763046] bg-[#99435b] px-2.5 py-2 text-[7px] text-[#fff9f0] shadow-[0_2px_0_#763046]">
          Descubrir la carta →
        </span>
        <div className="absolute right-[3%] top-[10%] h-[85%] w-[47%] rounded-[50%] bg-[#f1dfea]">
          <Image
            src="/templates/marshmallow/sundae.svg"
            alt=""
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      </div>
      <div className="mx-[7%] flex justify-around rounded-sm border border-[#aab79a] bg-[#dce7c7] py-2 text-[6px] font-bold uppercase tracking-wider">
        <span>A tu gusto</span>
        <span>✳</span>
        <span>Con una sonrisa</span>
      </div>
      <div className="px-[7%] pt-[7%]">
        <p className="font-[family-name:var(--font-noir-serif)] text-lg">
          ¿Qué te apetece?
        </p>
        <div className="mb-3 mt-2 flex gap-2 text-[7px]">
          <span className="rounded-full bg-[#493332] px-3 py-1 text-[#fff9f0]">
            Todo
          </span>
          <span className="rounded-full border border-[#e5d8cb] px-3 py-1">
            Helados
          </span>
          <span className="rounded-full border border-[#e5d8cb] px-3 py-1">
            Copas
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              name: "Fresa de verano",
              asset: "strawberry",
              price: "3,50",
              bg: "#f5d8e0",
            },
            {
              name: "Pistacho cremoso",
              asset: "pistachio",
              price: "3,90",
              bg: "#e1e9cf",
            },
          ].map((treat) => (
            <div
              key={treat.asset}
              className="overflow-hidden rounded-t-[48px] rounded-b-xl border border-[#e5d8cb] bg-[#fffdf8]"
            >
              <div
                className="relative aspect-square"
                style={{ background: treat.bg }}
              >
                <Image
                  src={`/templates/marshmallow/${treat.asset}.svg`}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="p-2">
                <p className="font-[family-name:var(--font-noir-serif)] text-[11px]">
                  {treat.name}
                </p>
                <div className="mt-2 flex items-center justify-between text-[8px]">
                  <span>{treat.price} €</span>
                  <span className="grid size-5 place-items-center rounded-full border border-[#a26877] bg-[#f8d8e0] shadow-[0_2px_0_#a26877]">
                    +
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {large && (
        <p className="px-6 pt-5 text-center text-[10px] text-[#78635e]">
          Vista del diseño con productos de ejemplo
        </p>
      )}
    </div>
  );
}
