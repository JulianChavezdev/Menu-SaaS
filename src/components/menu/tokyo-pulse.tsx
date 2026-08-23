"use client";

import { useEffect, useRef } from "react";
import { Menu, Plus, ShoppingBasket } from "lucide-react";

export function TokyoPulseTicker({
  items,
  compact = false,
  className = "",
}: {
  items: string[];
  compact?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const labels = items.length > 0 ? items : ["SUSHI", "RAMEN", "IZAKAYA"];
  const labelsKey = labels.join("|");

  useEffect(() => {
    const track = trackRef.current;
    if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const animation = track.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      {
        duration: compact ? 9000 : 14000,
        iterations: Infinity,
        easing: "linear",
      },
    );
    return () => animation.cancel();
  }, [compact, labelsKey]);

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden bg-[#FF5A36] text-[#1A0D14] ${className}`}
    >
      <div
        ref={trackRef}
        className={`flex w-max items-center whitespace-nowrap font-[var(--font-tokyo-sans)] font-bold uppercase tracking-[.18em] ${compact ? "h-5 text-[6px]" : "h-7 text-[9px]"}`}
      >
        {[...labels, ...labels].map((label, index) => (
          <span key={`${label}-${index}`} className={compact ? "px-2" : "px-4"}>
            <span className="mr-2 text-[#FFF1D7]">日</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TokyoPulseHamburger() {
  return (
    <span className="grid size-11 place-items-center border border-[#FF5A36] bg-[#1A0D14]/75 text-[#FFF1D7]">
      <Menu aria-hidden="true" size={22} strokeWidth={1.7} />
    </span>
  );
}

export function TokyoPulseBasket() {
  return (
    <span className="grid size-11 place-items-center border border-[#7CC7A1] bg-[#1A0D14]/75 text-[#7CC7A1]">
      <ShoppingBasket aria-hidden="true" size={22} strokeWidth={1.7} />
    </span>
  );
}

export function TokyoPulseAdd() {
  return (
    <span className="relative block size-11">
      <span className="absolute inset-1 translate-x-1 translate-y-1 border border-[#7CC7A1]" />
      <span className="absolute inset-1 grid place-items-center bg-[#FF5A36] text-[#1A0D14]">
        <Plus aria-hidden="true" size={23} strokeWidth={2.4} />
      </span>
    </span>
  );
}
