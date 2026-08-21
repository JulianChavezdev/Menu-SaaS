export const NOIRLUXE_TOKENS = {
  colors: {
    canvas: "#111111",
    translucentSurface: "rgba(17,17,17,.4)",
    heading: "#FFFFFF",
    body: "#F0E9DB",
    primary: "#C9A96E",
    primaryTransparent: "rgba(201,169,110,.33)",
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
  },
  typography: {
    dishName:
      "[font-family:var(--font-noir-serif)] text-[32px] font-normal italic leading-[38px] tracking-normal",
    price:
      "[font-family:var(--font-noir-serif)] text-[28px] font-normal leading-8 tracking-normal",
    tagline:
      "[font-family:var(--font-noir-sans)] text-sm font-medium leading-3 tracking-[.02em]",
    title:
      "[font-family:var(--font-noir-sans)] text-base font-bold leading-[19px] tracking-normal",
    badge:
      "[font-family:var(--font-noir-sans)] text-[8px] font-normal leading-5 tracking-normal",
    body: "[font-family:var(--font-noir-sans)] text-xs font-light leading-5 tracking-normal",
    category:
      "[font-family:var(--font-noir-sans)] text-sm font-normal leading-4 tracking-[.16em]",
    label:
      "[font-family:var(--font-noir-sans)] text-[8px] font-medium leading-3 tracking-normal",
    tag: "[font-family:var(--font-noir-sans)] text-[8px] font-black leading-3 tracking-normal",
  },
} as const;
