"use client";

import { useEffect, useRef } from "react";
import { Menu, Plus, ShoppingBag } from "lucide-react";

export function SocialHudMarquee({
  label,
  compact = false,
  className = "",
}: {
  label: string;
  compact?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const animation = track.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      { duration: 10000, iterations: Infinity, easing: "linear" },
    );
    return () => animation.cancel();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden whitespace-nowrap text-white/80 ${className}`}
    >
      <div
        ref={trackRef}
        className={`flex w-max items-center font-sans font-medium ${compact ? "text-[5px]" : "text-[9px]"}`}
      >
        {[0, 1, 2, 3].map((copy) => (
          <span key={copy} className={compact ? "pr-4" : "pr-8"}>
            <span className="mr-2 inline-block size-1.5 rounded-full bg-[#25F4EE]" />
            {label}
            <span className="ml-2 text-[#FE2C55]">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SocialHudHamburger() {
  return (
    <span className="grid size-9 place-items-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-md">
      <Menu aria-hidden="true" size={20} strokeWidth={2} />
    </span>
  );
}

export function SocialHudBasket() {
  return (
    <span className="relative grid size-9 place-items-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-md">
      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#25F4EE]" />
      <span className="absolute -bottom-0.5 right-1 size-3 rounded-full bg-[#FE2C55] mix-blend-screen" />
      <ShoppingBag aria-hidden="true" size={19} strokeWidth={2} />
    </span>
  );
}

export function SocialHudAdd({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`relative grid place-items-center rounded-full bg-white text-[#0B0B0D] shadow-lg ${compact ? "size-8" : "size-11"}`}
    >
      <span className="absolute -left-0.5 inset-y-1.5 w-2 rounded-l-full bg-[#25F4EE]" />
      <span className="absolute -right-0.5 inset-y-1.5 w-2 rounded-r-full bg-[#FE2C55]" />
      <Plus aria-hidden="true" size={compact ? 17 : 22} strokeWidth={2.5} />
    </span>
  );
}
