import Image from "next/image";

type FigmaTheme = "street" | "cozy-corner";

export function FigmaThemeHamburger({ theme }: { theme: FigmaTheme }) {
  const color = theme === "street" ? "#FFD600" : "#FFD600";
  return (
    <span aria-hidden="true" className="flex w-5 flex-col gap-1">
      {[0, 1, 2].map((line) => (
        <span
          key={line}
          className="h-[3px] rounded-[1px]"
          style={{ background: color }}
        />
      ))}
    </span>
  );
}

export function FigmaThemeBasket({ theme }: { theme: FigmaTheme }) {
  const base = `/themes/${theme}`;
  return (
    <span aria-hidden="true" className="relative block size-8 overflow-hidden">
      <Image
        src={`${base}/basket-main.svg`}
        alt=""
        width={24}
        height={22}
        className="absolute bottom-[8.33%] left-[12.5%] h-[62.5%] w-[66.67%]"
      />
      <Image
        src={`${base}/basket-handle.svg`}
        alt=""
        width={13}
        height={12}
        className="absolute left-[29.17%] top-[8.33%] h-[31.25%] w-[33.33%]"
      />
      <Image
        src={`${base}/basket-heart.svg`}
        alt=""
        width={12}
        height={10}
        className="absolute bottom-[8.33%] right-[12.5%] h-[25%] w-[29.17%]"
      />
    </span>
  );
}

export function FigmaThemeAdd({ theme }: { theme: FigmaTheme }) {
  const base = `/themes/${theme}`;
  return (
    <span aria-hidden="true" className="relative block size-11 overflow-hidden">
      <Image
        src={`${base}/add-circle.svg`}
        alt=""
        width={33}
        height={33}
        className="absolute inset-[12.5%] size-[75%]"
      />
      <Image
        src={`${base}/add-plus.svg`}
        alt=""
        width={17}
        height={17}
        className="absolute inset-[31.25%] size-[37.5%]"
      />
    </span>
  );
}

export function FigmaThemeProgress({ theme }: { theme: FigmaTheme }) {
  const active = theme === "street" ? "#FFD600" : "#FF3B30";
  return (
    <span aria-hidden="true" className="flex flex-col items-center gap-1">
      <span className="h-7 w-1 rounded-full bg-white" />
      <span className="h-4 w-1 rounded-full bg-white" />
      <span className="h-7 w-1 rounded-full" style={{ background: active }} />
    </span>
  );
}
