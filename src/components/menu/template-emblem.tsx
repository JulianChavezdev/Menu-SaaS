import type { MenuTemplateKey } from "@/lib/menu-templates";
import type { ReactNode } from "react";

/** Small, distinct marks for the template picker; names remain visible beside them. */
export function TemplateEmblem({ template, className = "" }: { template: MenuTemplateKey; className?: string }) {
  const artwork: Record<MenuTemplateKey, ReactNode> = {
    cinematic: <>
      <path d="M10 17h52v40H10z" fill="#211D19" stroke="#EBC181" strokeWidth="2"/>
      <path d="M10 25h52M10 49h52" stroke="#EBC181" strokeWidth="1.5"/>
      <path d="M17 17v8m11-8v8m16-8v8m11-8v8M17 49v8m11-8v8m16-8v8m11-8v8" stroke="#EBC181" strokeWidth="2"/>
      <path d="m30 31 15 6-15 8z" fill="#EBC181"/>
      <path d="M5 26V12h15m32 0h15v14M5 48v14h15m32 0h15V48" fill="none" stroke="#A67840" strokeWidth="1.5"/>
      <circle cx="58" cy="12" r="3" fill="#E58064"/>
    </>,
    noirluxe: <>
      <path d="M36 4 62 19v34L36 68 10 53V19Z" fill="#191815" stroke="#C9A96E" strokeWidth="1.5"/>
      <path d="m36 10 20 12v28L36 62 16 50V22Z" fill="none" stroke="#79613E"/>
      <path d="M25 48V25l22 23V25M22 25h9m11 0h9M21 48h9m12 0h9" fill="none" stroke="#F0DCB2" strokeWidth="2.5"/>
      <path d="m36 14 3 4-3 4-3-4zm0 38 3 4-3 4-3-4z" fill="#C9A96E"/>
      <path d="M4 30v12m64-12v12" stroke="#C9A96E" strokeWidth="1.5"/>
    </>,
    street: <>
      <path d="m35 3 8 8 12-3 2 12 11 6-6 11 5 11-12 5-4 13-12-4-10 7-7-11-13-1 1-13-8-9 10-8-1-13 14 1Z" fill="#FFD600"/>
      <g transform="rotate(-9 36 36)" stroke="#201B12" strokeWidth="3" strokeLinejoin="round">
        <path d="M20 32a16 14 0 0 1 32 0Z" fill="#FFD600"/>
        <path d="M19 38h34M22 46h28l-3 6H25Z" fill="#201B12"/>
        <path d="m20 40 9 5 8-5 8 5 7-5" fill="none"/>
      </g>
      <path d="m30 23 2 1m9-1 2-1" stroke="#201B12" strokeWidth="2" strokeLinecap="round"/>
    </>,
    "cozy-corner": <>
      <path d="M11 60V30a25 25 0 0 1 50 0v30Z" fill="#E74F42" stroke="#FFB897" strokeWidth="1.5"/>
      <path d="M16 56V30a20 20 0 0 1 40 0v26" fill="none" stroke="#FFB897"/>
      <path d="M24 34h22v10a11 11 0 0 1-22 0Zm22 2h4a6 6 0 0 1 0 12h-5" fill="#FFF0C9" stroke="#FFF0C9" strokeWidth="2"/>
      <path d="M21 56h30M30 28c-6-6 5-5 0-11m10 11c-6-6 5-5 0-11" fill="none" stroke="#FFF0C9" strokeWidth="2" strokeLinecap="round"/>
      <path d="m6 26 2 4 4 2-4 2-2 4-2-4-4-2 4-2m57 9 2 4 4 2-4 2-2 4-2-4-4-2 4-2" fill="#FFD471"/>
    </>,
    "tokyo-pulse": <>
      <circle cx="38" cy="26" r="23" fill="#FF5A36"/>
      <path d="m17 30 42-14M20 35l42-14" stroke="#FFF1D7" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M11 39h50a25 22 0 0 1-50 0Z" fill="#1A2522" stroke="#7CC7A1" strokeWidth="2"/>
      <path d="M13 45h46M28 62h16M23 53h7m4 0h7m4 0h5" stroke="#7CC7A1" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 32c-4 4 7 7 3 11m7-12c-4 4 7 7 3 11" fill="none" stroke="#FFF1D7" strokeWidth="2"/>
      <path d="M7 13v9m-4-5h8" stroke="#7CC7A1" strokeWidth="2"/>
    </>,
    "social-hud": <>
      <rect x="17" y="7" width="38" height="56" rx="11" fill="#25F4EE" transform="rotate(-10 36 35)"/>
      <rect x="20" y="8" width="38" height="56" rx="11" fill="#FE2C55" transform="rotate(8 39 36)"/>
      <rect x="19" y="7" width="36" height="56" rx="10" fill="#13151B" stroke="#F2F3F5" strokeWidth="1.5"/>
      <path d="M30 13h14m-12 43h10" stroke="#F2F3F5" strokeWidth="2" strokeLinecap="round"/>
      <path d="m31 26 15 9-15 9Z" fill="#F2F3F5"/>
      <path d="M57 38c-8-7-15 4 0 13 15-9 8-20 0-13" fill="#FE2C55" stroke="#13151B" strokeWidth="2"/>
      <path d="M10 17v10M5 22h10" stroke="#25F4EE" strokeWidth="2" strokeLinecap="round"/>
    </>,
    marshmallow: <>
      <path d="m22 39 14 28 15-28" fill="#EFD8B5" stroke="#AB795F" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="m27 46 15 8m-11 1 7 4m7-13-14 9m7-13-10 7" stroke="#C59778" strokeWidth="1.2"/>
      <path d="M18 39a12 12 0 0 1-1-23 16 16 0 0 1 30-3 13 13 0 0 1 10 25c-3 5-9 4-12 1-4 5-11 5-15 0-4 5-10 4-12 0Z" fill="#F4C6D6" stroke="#A5687D" strokeWidth="1.5"/>
      <path d="M38 13c-8 5-6 16 1 19 3 1 8 1 10-1" fill="#DCCBEA"/>
      <path d="M21 19c0-4 3-6 7-6" fill="none" stroke="#FFF8F0" strokeWidth="3" strokeLinecap="round"/>
      <path d="m61 46 3 4 5 1-4 3-1 5-3-4-5-1 4-3M9 7l2 4 4 1-3 3-1 4-2-4-4-1 3-3" fill="#DBE7CE"/>
      <path d="m16 49 2 4m38-45 3 3" stroke="#DCCBEA" strokeWidth="2.5" strokeLinecap="round"/>
    </>,
  };
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 72 72" fill="none" className={className}>{artwork[template]}</svg>;
}
