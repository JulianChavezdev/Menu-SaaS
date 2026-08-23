"use client";

import { useEffect, useRef } from "react";

export function MareNostrumWave({
  compact = false,
  className = "",
}: {
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
      { duration: 12000, iterations: Infinity, easing: "linear" },
    );
    return () => animation.cancel();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden text-[#F7F0DF] ${className}`}
    >
      <div ref={trackRef} className="flex w-[200%]">
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            viewBox="0 0 430 24"
            preserveAspectRatio="none"
            className={compact ? "h-3 w-1/2" : "h-5 w-1/2"}
          >
            <path
              d="M0 13C24 1 48 1 72 13s48 12 72 0 48-12 72 0 48 12 72 0 48-12 72 0 48 12 72 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M-36 21c24-12 48-12 72 0s48 12 72 0 48-12 72 0 48 12 72 0 48-12 72 0 48 12 72 0 48-12 72 0"
              fill="none"
              stroke="#E5745D"
              strokeWidth="1"
              opacity=".75"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

export function MareNostrumHamburger() {
  return (
    <span className="relative grid size-10 place-items-center rounded-full border border-[#F7F0DF]/70 bg-[#0B3B60]/85 text-[#F7F0DF] shadow-md">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
        <path
          d="M4 7c3-2 5 2 8 0s5 2 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M4 12c3-2 5 2 8 0s5 2 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M4 17c3-2 5 2 8 0s5 2 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-[#E5745D]" />
    </span>
  );
}

export function MareNostrumBasket() {
  return (
    <span className="grid size-10 place-items-center rounded-full border border-[#F7F0DF]/70 bg-[#0B3B60]/85 text-[#F7F0DF] shadow-md">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
        <path
          d="M5 9h14l-1.2 10H6.2L5 9Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 10c0-4.5 8-4.5 8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M9 14c1.8-1.5 4.2-1.5 6 0-1.8 1.5-4.2 1.5-6 0Z"
          fill="#E5745D"
        />
        <circle cx="14.3" cy="13.7" r=".5" fill="#F7F0DF" />
      </svg>
    </span>
  );
}

export function MareNostrumAdd() {
  return (
    <span className="relative grid size-10 place-items-center rounded-full bg-[#E5745D] text-[#F7F0DF] shadow-[0_5px_16px_rgba(11,59,96,.3)]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
        <circle
          cx="12"
          cy="12"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".55"
        />
        <path
          d="M12 7v10M7 12h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function MareNostrumSeal({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center rounded-full border border-[#F7F0DF]/70 text-[#F7F0DF] ${compact ? "size-7" : "size-10"}`}
    >
      <span className="absolute inset-1 rounded-full border border-[#E5745D]/80" />
      <span
        className={`font-[var(--font-mare-serif)] italic ${compact ? "text-[9px]" : "text-sm"}`}
      >
        M
      </span>
    </span>
  );
}
