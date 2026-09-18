"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Eye, Info, Languages, List, Lock, Share2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import {
  translateEntireMenu,
  updateAppearancePreferences,
} from "@/app/dashboard/actions";
import {
  MENU_TEMPLATES,
  resolveMenuTemplate,
  type MenuTemplateKey,
} from "@/lib/menu-templates";
import { ThemeVectors } from "@/components/menu/theme-vectors";
import {MarshmallowIcon} from "@/components/menu/marshmallow-controls";
import { notifyAutomaticTranslation } from "@/components/dashboard/automatic-translation";
import {
  NoirLuxeAddIcon,
  NoirLuxeBasketIcon,
  NoirLuxeHamburgerIcon,
  NoirLuxeProgress,
} from "@/components/menu/noirluxe-icons";
import { NOIRLUXE_TOKENS } from "@/lib/noirluxe-design-tokens";
import {
  FigmaThemeAdd,
  FigmaThemeBasket,
  FigmaThemeHamburger,
} from "@/components/menu/figma-theme-icons";
import {
  TokyoPulseAdd,
  TokyoPulseBasket,
  TokyoPulseHamburger,
  TokyoPulseTicker,
} from "@/components/menu/tokyo-pulse";
import {
  SocialHudAdd,
  SocialHudBasket,
  SocialHudHamburger,
  SocialHudMarquee,
} from "@/components/menu/social-hud";

type PreviewProduct = {
  name: string;
  priceCents: number;
  videoUrl: string | null;
  category: string;
};
type PreviewProps = {
  kind: MenuTemplateKey;
  restaurantName: string;
  logoUrl: string | null;
  currency: string;
  product?: PreviewProduct;
  large?: boolean;
};

function TemplatePreview({
  kind,
  restaurantName,
  logoUrl,
  currency,
  product,
  large = false,
}: PreviewProps) {
  const template = MENU_TEMPLATES[kind];
  const { colors } = template;
  const framed = template.layout === "framed";
  const card = template.layout !== "fullscreen";
  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format((product?.priceCents ?? 1290) / 100);
  if(kind==="marshmallow")return <div data-dashboard-preview className={`relative mx-auto w-full overflow-hidden bg-[#FFF8F0] p-[6%] text-[#573E43] ${large?"h-[min(70dvh,620px)] max-w-[350px]":"aspect-[9/12]"}`} style={{fontFamily:"var(--font-cozy-sans)"}}>
    <div className="flex items-center justify-between gap-2"><List size={18}/><span className="flex min-w-0 items-center gap-1"><MarshmallowIcon kind="scoop" width={22}/><span className="truncate text-xs font-extrabold">{restaurantName}</span></span><Languages size={18}/></div>
    <div className="absolute inset-x-[2%] bottom-[2%] top-[15%] overflow-hidden rounded-[24px_24px_32px_20px] border border-[#DECBC7] bg-[#E9DBD4] shadow-[3px_3px_0_#E6D9ED]">{product?.videoUrl?<video src={product.videoUrl} muted loop autoPlay playsInline className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center bg-[#F7E3DA]"><MarshmallowIcon kind="scoop" width={64} height={64}/></div>}</div>
    <div className="absolute left-[6%] top-[18%] max-w-[66%] rounded-xl border border-[#C493A6] bg-[#F4C6D6] px-3 py-2 text-[#683349]"><span className="block text-[7px] font-bold uppercase tracking-widest">Categorías</span><span className="flex items-center gap-2 text-[10px] font-extrabold"><span className="truncate">{product?.category??"Categoría"}</span><ChevronDown size={12}/></span></div>
    <div className="absolute right-[6%] top-[18%] flex flex-col gap-2">{[VolumeX,Info,Share2].map((Icon,index)=><span key={index} className="grid size-8 place-items-center rounded-full border border-[#D9CADD] bg-[#F3E9F6] text-[#684854]"><Icon size={14}/></span>)}</div>
    <div className="absolute inset-x-[6%] bottom-[17%] rounded-2xl border border-[#FFF8F0] bg-[#FFF8F0]/95 px-3 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className={`truncate font-extrabold tracking-tight ${large?"text-xl":"text-sm"}`}>{product?.name??"Nombre del producto"}</p><strong className="text-sm text-[#8A3D56]">{price}</strong></div><span className="flex items-center rounded-xl bg-[#F4C6D6] p-1 text-[9px] font-bold text-[#683349]"><MarshmallowIcon kind="add" width={24} height={24}/>Añadir</span></div>
      <p className="mt-1 text-[9px] text-[#765961]">Descripción⌄</p>
    </div>
    <div className="absolute bottom-[5%] right-[6%] flex items-center gap-2 rounded-2xl border border-[#BBCAAD] bg-[#DBE7CE] px-3 py-1 text-[10px] font-extrabold text-[#3C5138] shadow-[0_3px_0_#A7B69A]"><MarshmallowIcon kind="bag" width={26} height={26}/>Carrito<span className="rounded-full bg-[#3C5138] px-1.5 py-0.5 text-[#FFF8F0]">0</span></div>
  </div>;
  if (kind === "noirluxe")
    return (
      <div
        data-dashboard-preview
        style={{ fontFamily: "var(--font-noir-sans)" }}
        className={`relative isolate mx-auto w-full overflow-hidden bg-[#111111] text-[#F0E9DB] shadow-2xl ${large ? "h-[min(70dvh,620px)] max-w-[350px]" : "aspect-[9/12]"}`}
      >
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#22221f]">
          {product?.videoUrl ? (
            <video
              src={product.videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_65%_25%,#765f3d,#25201a_48%,#111111)]" />
          )}
        </div>
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(17,17,17,.4)_0%,rgba(17,17,17,.08)_42%,rgba(17,17,17,.4)_62%,#111111_100%)]" />
        <header
          className={`absolute inset-x-0 top-0 z-10 flex items-start justify-between bg-gradient-to-b from-[#111111]/40 to-transparent ${large ? "px-6 pb-6 pt-4" : "px-3 pb-4 pt-2"}`}
        >
          <NoirLuxeHamburgerIcon />
          <div className="min-w-0 flex-1 px-2 text-center">
            {logoUrl && (
              <span
                role="img"
                aria-label={`Logo de ${restaurantName}`}
                className={`mx-auto block bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)] ${large ? "h-12 w-40" : "h-7 w-24"}`}
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            )}
          </div>
          <span
            className={
              large ? "scale-100 origin-top-right" : "scale-50 origin-top-right"
            }
          >
            <NoirLuxeBasketIcon />
          </span>
        </header>
        <nav
          aria-label="Vista de categorías"
          className={`absolute inset-x-0 z-10 flex overflow-hidden uppercase ${large ? `top-[72px] gap-7 px-6 ${NOIRLUXE_TOKENS.typography.category}` : "top-[40px] gap-3 px-3 text-[6px] leading-[8px] tracking-[.16em]"}`}
        >
          <span className="shrink-0 border-b border-[#C9A96E] pb-1 text-white">
            {product?.category ?? "Entrantes"}
          </span>
          <span className="shrink-0 border-b border-[#111111] text-[#F0E9DB]">
            Principales
          </span>
          <span className="shrink-0 border-b border-[#111111] text-[#F0E9DB]">
            Postres
          </span>
        </nav>
        <div
          className={`absolute inset-x-0 bottom-0 z-10 ${large ? "p-6" : "p-3"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`bg-[#111111]/40 uppercase text-white ${large ? `px-2 py-1 ${NOIRLUXE_TOKENS.typography.badge}` : "px-1.5 py-1 text-[5px] leading-[8px]"}`}
            >
              {product?.category ?? "Especialidades"}
            </span>
            <span className={large ? "scale-100" : "scale-50 origin-right"}>
              <NoirLuxeAddIcon />
            </span>
          </div>
          <p
            className={`text-[#C9A96E] ${large ? `mt-2 ${NOIRLUXE_TOKENS.typography.dishName}` : "mt-1 font-[var(--font-noir-serif)] text-base font-normal italic leading-[18px]"}`}
          >
            {product?.name ?? "Producto destacado"}
          </p>
          <p
            className={`text-[#F0E9DB] ${large ? `mt-1 ${NOIRLUXE_TOKENS.typography.body}` : "mt-0.5 text-[6px] font-light leading-3"}`}
          >
            Una propuesta especial de nuestra cocina.
          </p>
          <div
            className={`flex items-center justify-between ${large ? "mt-3" : "mt-1"}`}
          >
            <strong
              className={`text-[#C9A96E] ${large ? NOIRLUXE_TOKENS.typography.price : "font-[var(--font-noir-serif)] text-sm font-normal leading-4"}`}
            >
              {price}
            </strong>
            <span
              className={
                large ? "scale-100 origin-right" : "scale-50 origin-right"
              }
            >
              <NoirLuxeProgress active={0} total={3} />
            </span>
          </div>
        </div>
      </div>
    );
  if (kind === "social-hud")
    return (
      <div
        data-dashboard-preview
        className={`relative isolate mx-auto w-full overflow-hidden bg-[#08080A] font-sans text-white shadow-2xl ${large ? "h-[min(70dvh,620px)] max-w-[350px]" : "aspect-[9/12]"}`}
      >
        <div className="absolute inset-0 bg-[#22221f]">
          {product?.videoUrl ? (
            <video
              src={product.videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_60%_30%,#a56754,#3e302b_45%,#08080A)]" />
          )}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,transparent_38%,rgba(0,0,0,.1)_55%,rgba(0,0,0,.9)_100%)]" />
        <header
          className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-black/45 to-transparent ${large ? "px-6 pb-3 pt-2.5" : "px-3 pb-2 pt-1.5"}`}
        >
          <span className={large ? "" : "origin-top-left scale-50"}>
            <SocialHudHamburger />
          </span>
          <div className="min-w-0 flex-1 px-2">
            {logoUrl ? (
              <span
                role="img"
                aria-label={`Logo de ${restaurantName}`}
                className={`mx-auto block bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)] ${large ? "h-12 w-52" : "h-8 w-32"}`}
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            ) : (
              <strong className="block truncate text-center">
                {restaurantName}
              </strong>
            )}
          </div>
          <span className={large ? "" : "origin-top-right scale-50"}>
            <SocialHudBasket />
          </span>
        </header>
        <nav
          className={`absolute inset-x-10 z-20 flex justify-center gap-4 overflow-hidden ${large ? "top-[52px]" : "top-[31px]"}`}
        >
          {[product?.category ?? "Para ti", "Favoritos", "Postres"].map(
            (category, index) => (
              <span
                key={category}
                className={`relative shrink-0 pb-1.5 font-bold ${index === 0 ? "text-white" : "text-white/50"} ${large ? "text-[10px]" : "text-[5px]"}`}
              >
                {category}
                {index === 0 && (
                  <span className="absolute inset-x-1 bottom-0 h-px bg-white shadow-[-1px_0_0_#25F4EE,1px_0_0_#FE2C55]" />
                )}
              </span>
            ),
          )}
        </nav>
        <div
          className={`absolute right-3 z-20 flex flex-col items-center ${large ? "bottom-24 gap-3" : "bottom-12 gap-1.5"}`}
        >
          {[VolumeX, Info, Share2].map((Icon, index) => (
            <span
              key={index}
              className={`grid place-items-center rounded-full bg-black/45 backdrop-blur-md ${large ? "size-10" : "size-5"}`}
            >
              <Icon size={large ? 19 : 10} />
            </span>
          ))}
          <SocialHudAdd compact={!large} />
        </div>
        <div
          className={`absolute bottom-0 left-0 right-14 z-10 ${large ? "p-6" : "p-3"}`}
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 font-bold uppercase backdrop-blur-md ${large ? "text-[8px]" : "text-[4px]"}`}
          >
            <span className="size-1 rounded-full bg-[#25F4EE] shadow-[1px_0_0_#FE2C55]" />
            {product?.category ?? "Especialidades"}
          </span>
          <p
            className={`font-extrabold tracking-[-.02em] ${large ? "mt-1.5 text-[26px] leading-7" : "mt-1 text-sm leading-[15px]"}`}
          >
            {product?.name ?? "Producto destacado"}
          </p>
          <strong
            className={`block font-extrabold ${large ? "mt-1 text-xl" : "mt-0.5 text-xs"}`}
          >
            {price}
          </strong>
          <SocialHudMarquee
            label={`${product?.category ?? "Carta"} · ${product?.name ?? "Producto destacado"}`}
            compact={!large}
            className={large ? "mt-1.5" : "mt-0.5"}
          />
        </div>
      </div>
    );
  if (kind === "tokyo-pulse")
    return (
      <div
        data-dashboard-preview
        style={{ fontFamily: "var(--font-tokyo-sans)" }}
        className={`relative isolate mx-auto w-full overflow-hidden bg-[#1A0D14] text-[#FFF1D7] shadow-2xl ${large ? "h-[min(70dvh,620px)] max-w-[350px]" : "aspect-[9/12]"}`}
      >
        <div className="absolute inset-0 bg-[#25141d]">
          {product?.videoUrl ? (
            <video
              src={product.videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_55%_36%,#b86f5b,#443029_45%,#1A0D14)]" />
          )}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,13,20,.58)_0%,transparent_38%,rgba(26,13,20,.3)_58%,#1A0D14_100%)]" />
        <header
          className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-[#1A0D14] via-[#1A0D14]/75 to-transparent ${large ? "px-6 pb-3 pt-2.5" : "px-3 pb-2 pt-1.5"}`}
        >
          <span className={large ? "" : "origin-top-left scale-50"}>
            <TokyoPulseHamburger />
          </span>
          <div className="min-w-0 flex-1 px-2">
            {logoUrl ? (
              <span
                role="img"
                aria-label={`Logo de ${restaurantName}`}
                className={`mx-auto block bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)] ${large ? "h-9 w-40" : "h-6 w-24"}`}
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            ) : (
              <strong className="block truncate text-center font-[var(--font-tokyo-serif)]">
                {restaurantName}
              </strong>
            )}
          </div>
          <span className={large ? "" : "origin-top-right scale-50"}>
            <TokyoPulseBasket />
          </span>
        </header>
        <TokyoPulseTicker
          items={[product?.category ?? "Sushi", "Ramen", "Izakaya"]}
          compact={!large}
          className={`absolute inset-x-0 z-20 ${large ? "top-[58px]" : "top-[34px]"}`}
        />
        <nav
          className={`absolute inset-x-4 z-20 flex gap-2 overflow-hidden ${large ? "top-[88px]" : "top-[56px]"}`}
        >
          {[product?.category ?? "Sushi", "Ramen", "Izakaya"].map(
            (category, index) => (
              <span
                key={category}
                className={`min-w-0 flex-1 truncate border px-2 py-1 text-center font-bold uppercase tracking-[.1em] ${index === 0 ? "border-[#FF5A36] bg-[#FF5A36] text-[#1A0D14]" : "border-[#7CC7A1]/65 bg-[#1A0D14]/70 text-[#FFF1D7] opacity-60"} ${large ? "text-[9px]" : "text-[5px]"}`}
              >
                {category}
              </span>
            ),
          )}
        </nav>
        <div
          className={`absolute inset-x-0 bottom-0 z-10 ${large ? "p-6" : "p-3"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`border-l-4 border-[#FF5A36] pl-2 font-bold uppercase tracking-[.18em] text-[#7CC7A1] ${large ? "text-[9px]" : "text-[5px]"}`}
            >
              {product?.category ?? "Especialidades"}
            </span>
            <span className={large ? "" : "origin-right scale-50"}>
              <TokyoPulseAdd />
            </span>
          </div>
          <p
            className={`font-[var(--font-tokyo-serif)] font-semibold text-[#FFF1D7] ${large ? "text-[27px] leading-8" : "text-[15px] leading-[17px]"}`}
          >
            {product?.name ?? "Producto destacado"}
          </p>
          <div
            className={`flex items-end justify-between ${large ? "mt-3" : "mt-1"}`}
          >
            <strong
              className={`border-b border-[#FF5A36] font-[var(--font-tokyo-serif)] text-[#FF5A36] ${large ? "pb-0.5 text-[22px]" : "text-[13px]"}`}
            >
              {price}
            </strong>
            <span
              className={`font-bold uppercase tracking-[.2em] text-[#7CC7A1] ${large ? "text-[8px]" : "text-[4px]"}`}
            >
              旬 · seasonal
            </span>
          </div>
        </div>
      </div>
    );
  if (kind === "street" || kind === "cozy-corner") {
    const street = kind === "street";
    const iconTheme = street ? "street" : "cozy-corner";
    return (
      <div
        data-dashboard-preview
        style={{
          fontFamily: street
            ? "var(--font-street-sans)"
            : "var(--font-cozy-sans)",
        }}
        className={`relative isolate mx-auto w-full overflow-hidden bg-white text-white shadow-2xl ${large ? "h-[min(70dvh,620px)] max-w-[350px]" : "aspect-[9/12]"}`}
      >
        <div className="absolute inset-0 bg-[#22221f]">
          {product?.videoUrl ? (
            <video
              src={product.videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_55%_42%,#ddd0b9,#756657_48%,#211d18)]" />
          )}
        </div>
        <div
          className={`absolute inset-0 ${street ? "bg-[linear-gradient(180deg,rgba(17,17,17,.5)_0%,transparent_42%,#111_100%)]" : "bg-[linear-gradient(180deg,rgba(17,17,17,.15)_15%,transparent_48%,rgba(17,17,17,.95)_100%)]"}`}
        />
        {!street && (
          <div
            className={`absolute inset-x-0 bottom-0 border-y-[6px] border-dashed border-[#FF3B30] ${large ? "top-[66px]" : "top-[42px]"}`}
          />
        )}
        <header
          className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 ${street ? (large ? "pt-4" : "pt-2") : large ? "h-[66px] bg-[#FF3B30]" : "h-[42px] bg-[#FF3B30]"}`}
        >
          <span className={large ? "" : "scale-75"}>
            <FigmaThemeHamburger theme={iconTheme} />
          </span>
          <div className="min-w-0 flex-1 px-2">
            {logoUrl ? (
              <span
                role="img"
                aria-label={`Logo de ${restaurantName}`}
                className={`mx-auto block bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)] ${large ? "h-12 w-44" : "h-7 w-28"}`}
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            ) : (
              <strong
                className={`block truncate text-center ${street ? "font-[var(--font-street-condensed)]" : "font-[var(--font-cozy-display)]"}`}
              >
                {restaurantName}
              </strong>
            )}
          </div>
          <span className={large ? "" : "scale-75"}>
            <FigmaThemeBasket theme={iconTheme} />
          </span>
        </header>
        <nav
          className={`absolute inset-x-4 z-10 flex gap-2 overflow-hidden ${street ? (large ? "top-[72px]" : "top-[40px]") : large ? "top-[78px]" : "top-[50px]"}`}
        >
          {[product?.category ?? "Entrantes", "Principales", "Postres"].map(
            (category, index) => (
              <span
                key={category}
                className={`min-w-0 flex-1 truncate px-2 py-1 text-center uppercase ${street ? `border-2 border-[#FFD600] font-[var(--font-street-condensed)] font-bold tracking-[1px] ${index === 0 ? "bg-[#FFD600] text-[#111]" : "bg-black/25"}` : `rounded-full font-[var(--font-cozy-display)] ${index === 0 ? "bg-[#FF3B30] text-[#FFD600]" : "bg-[#FF3B30]/70"}`} ${large ? "text-[10px]" : "text-[6px]"}`}
              >
                {category}
              </span>
            ),
          )}
        </nav>
        <div
          className={`absolute inset-x-0 bottom-0 z-10 ${large ? "p-6" : "p-3"}`}
        >
          <p
            className={`${street ? "font-[var(--font-street-sans)] font-bold tracking-[2px] text-[#FFD600]" : "font-[var(--font-cozy-display)] tracking-[1.92px] text-[#FF3B30]"} ${large ? "text-2xl leading-6" : "text-sm leading-4"}`}
          >
            {product?.name ?? "Producto destacado"}
          </p>
          <div
            className={`flex items-center justify-between ${large ? "mt-3" : "mt-1"}`}
          >
            <strong
              className={`${street ? "bg-[#FFD600] text-[#111]" : "rounded-lg bg-[#FF3B30] text-white"} font-[var(--font-street-condensed)] font-extrabold ${large ? "px-4 py-2 text-3xl" : "px-2 py-1 text-base"}`}
            >
              {price}
            </strong>
            <span className={large ? "" : "scale-50 origin-right"}>
              <FigmaThemeAdd theme={iconTheme} />
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
        data-dashboard-preview
      style={{ background: colors.background }}
      className={`relative isolate mx-auto w-full overflow-hidden text-white shadow-2xl ${large ? "h-[min(70dvh,620px)] max-w-[350px] rounded-xl" : "aspect-[9/12] rounded-2xl"}`}
    >
      <div
        style={{ borderColor: colors.frame }}
        className={`absolute z-0 overflow-hidden ${framed ? "inset-2 bottom-14 rounded-lg border" : "inset-0"}`}
      >
        {product?.videoUrl ? (
          <video
            src={product.videoUrl}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `radial-gradient(circle at 65% 25%,${colors.accent2}99,${colors.panel} 48%,${colors.background})`,
            }}
          />
        )}
      </div>
      <div
        className={`absolute z-[1] ${framed ? "inset-2 bottom-14 rounded-lg" : "inset-0"}`}
        style={{
          background: `linear-gradient(to bottom,${colors.background}33,transparent 42%,${colors.background}f2)`,
        }}
      />
      <ThemeVectors
        motif={template.motif}
        accent={colors.accent}
        accent2={colors.accent2}
        className="absolute inset-0 z-[2] h-full w-full"
      />
      <div className="absolute left-3 right-3 top-3 z-10 flex h-8 items-center justify-center">
        {logoUrl ? (
          <span
            role="img"
            aria-label={`Logo de ${restaurantName}`}
            className="h-10 w-36 bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)]"
            style={{ backgroundImage: `url(${logoUrl})` }}
          />
        ) : (
          <strong
            className={`${large ? "text-base" : "text-[10px]"} drop-shadow-lg`}
          >
            {restaurantName}
          </strong>
        )}
      </div>
      <div
        style={
          card
            ? { background: `${colors.panel}d9`, borderColor: colors.frame }
            : undefined
        }
        className={`absolute z-10 ${card ? "bottom-16 left-4 right-4 rounded-2xl border p-3 backdrop-blur-md" : "bottom-4 left-4 right-4"}`}
      >
        <p
          style={{ color: colors.accent }}
          className={`truncate font-bold uppercase tracking-[.15em] ${large ? "text-[10px]" : "text-[7px]"}`}
        >
          {product?.category ?? "Especialidades"}
        </p>
        <p
          className={`mt-1 line-clamp-2 font-semibold leading-none ${large ? "text-2xl" : "text-sm"}`}
        >
          {product?.name ?? "Producto destacado"}
        </p>
        <p
          style={{ color: colors.accent }}
          className={`mt-2 font-bold ${large ? "text-lg" : "text-xs"}`}
        >
          {price}
        </p>
      </div>
      <div
        style={{ background: colors.nav, borderColor: colors.frame }}
        className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-3 rounded-xl border px-4 py-2"
      >
        {[0, 1, 2, 3].map((item) => (
          <span
            key={item}
            style={{
              background: item === 0 ? colors.accent : "rgba(255,255,255,.55)",
            }}
            className="h-1.5 w-1.5 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

const APPEARANCE_TABS = [
  { key: "design", label: "Diseño" },
  { key: "logo", label: "Logo" },
  { key: "languages", label: "Idiomas" },
] as const;

export function AppearancePreferences({
  enabled, template, canUsePremium, restaurantName, logoUrl, currency,
  previewProduct, logoEditor,
}: {
  enabled: boolean;
  template?: string;
  canUsePremium: boolean;
  restaurantName: string;
  logoUrl: string | null;
  currency: string;
  previewProduct?: PreviewProduct;
  logoEditor?: ReactNode;
}) {
  const current = resolveMenuTemplate(template, canUsePremium);
  const [selected, setSelected] = useState<MenuTemplateKey>(current.key);
  const [languageEnabled, setLanguageEnabled] = useState(enabled);
  const [saved, setSaved] = useState({ template: current.key, language: enabled });
  const [tab, setTab] = useState<(typeof APPEARANCE_TABS)[number]["key"]>("design");
  const [preview, setPreview] = useState<MenuTemplateKey | null>(null);
  const [wide, setWide] = useState(false);
  const [saving, startSaving] = useTransition();
  const [translating, startTranslation] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = selected !== saved.template || languageEnabled !== saved.language;
  const previewProps = { restaurantName, logoUrl, currency, product: previewProduct };

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!preview) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [preview]);

  return <>
    <div role="tablist" aria-label="Ajustes de apariencia" className="appearance-tabs">
      {APPEARANCE_TABS.map((item, index) => <button
        key={item.key} type="button" role="tab" id={`appearance-tab-${item.key}`}
        aria-controls={`appearance-panel-${item.key}`} aria-selected={tab === item.key}
        tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)}
        onKeyDown={(event) => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % APPEARANCE_TABS.length;
          else if (event.key === "ArrowLeft") next = (index + APPEARANCE_TABS.length - 1) % APPEARANCE_TABS.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = APPEARANCE_TABS.length - 1;
          else return;
          event.preventDefault();
          setTab(APPEARANCE_TABS[next].key);
          document.getElementById(`appearance-tab-${APPEARANCE_TABS[next].key}`)?.focus();
        }}
      >{item.label}</button>)}
    </div>

    <form onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      startSaving(async () => {
        try {
          const result = await updateAppearancePreferences(form);
          setSaved({ template: form.get("menu_template") as MenuTemplateKey, language: form.has("language_switcher_enabled") });
          toast.success("Preferencias guardadas");
          notifyAutomaticTranslation(result.translationStatus);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo guardar");
        }
      });
    }}>
      <input type="hidden" name="menu_template" value={selected} />
      {languageEnabled && <input type="hidden" name="language_switcher_enabled" value="on" />}
      <section role="tabpanel" id="appearance-panel-design" aria-labelledby="appearance-tab-design" hidden={tab !== "design"} tabIndex={0}>
        <div className="appearance-design">
          <div className="appearance-choices">
            <div className="appearance-section-heading"><h2>Plantilla de la carta</h2><span>{Object.keys(MENU_TEMPLATES).length} estilos</span></div>
            <p className="appearance-help">Selecciona un diseño. Los cambios se aplican al guardar.</p>
            <fieldset disabled={saving} className="appearance-options">
              <legend className="sr-only">Plantillas de la carta</legend>
              {Object.values(MENU_TEMPLATES).map((item) => {
                const locked = item.tier === "premium" && !canUsePremium;
                return <article key={item.key} className="appearance-option" data-selected={selected === item.key}>
                  <label className="appearance-choice" data-locked={locked}>
                    <input type="radio" name="template_choice" value={item.key}
                      aria-label={`Seleccionar plantilla ${item.name}`} checked={selected === item.key}
                      onChange={() => setSelected(item.key)} disabled={locked} />
                    <span className="appearance-swatches" aria-hidden="true">
                      {[item.colors.background, item.colors.accent, item.colors.accent2].map((color, i) => <i key={i} style={{ backgroundColor: color }} />)}
                    </span>
                    <strong>{item.name}</strong>
                    <span className="appearance-help">{item.previewLabel}</span>
                  </label>
                  <div className="appearance-option-footer">
                    <span className="appearance-tier">{locked && <Lock size={11} aria-hidden="true" />}{item.tier === "free" ? "Incluida" : "Pro"}</span>
                    <button type="button" onClick={() => setPreview(item.key)} aria-label={`Vista previa de ${item.name}`} title={`Vista previa de ${item.name}`}><Eye size={16} aria-hidden="true" /></button>
                  </div>
                </article>;
              })}
            </fieldset>
            {!canUsePremium && <p className="appearance-upgrade">Los estilos Pro requieren un plan de pago. <Link href="/dashboard/billing?from=templates">Ver planes →</Link></p>}
          </div>
          {wide && tab === "design" && <aside className="appearance-preview" aria-label="Vista previa del diseño seleccionado">
            <div className="appearance-section-heading"><h2>Vista previa</h2><span>{MENU_TEMPLATES[selected].name}</span></div>
            {!preview && <div className="appearance-phone"><TemplatePreview kind={selected} {...previewProps} /></div>}
            <button type="button" className="workspace-button" onClick={() => setPreview(selected)}><Eye size={15} aria-hidden="true" /> Ampliar vista previa</button>
          </aside>}
        </div>
      </section>

      <section role="tabpanel" id="appearance-panel-languages" aria-labelledby="appearance-tab-languages" hidden={tab !== "languages"} tabIndex={0}>
        <div className="appearance-settings">
          <h2>Idiomas de la carta</h2>
          <p className="appearance-help">Escribe en español y ofrece también tu carta en inglés.</p>
          <label className="appearance-language-toggle">
            <span><strong>Mostrar selector de idioma</strong><small>El cliente podrá elegir entre español e inglés.</small></span>
            <input type="checkbox" checked={languageEnabled} disabled={saving} onChange={(event) => setLanguageEnabled(event.target.checked)} aria-label="Mostrar selector de idioma" />
          </label>
          <div className="appearance-translation">
            <div><h3>Traducción del contenido</h3><p className="appearance-help">Al activar el selector y guardar se traduce la carta. También puedes actualizar la traducción aquí.</p></div>
            <button type="button" disabled={translating || saving} className="workspace-button"
              onClick={() => startTranslation(async () => {
                try {
                  const result = await translateEntireMenu();
                  notifyAutomaticTranslation(result.translationStatus);
                  if (result.translationStatus === "translated") toast.success(`${result.translatedCount} elementos traducidos`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo traducir la carta");
                }
              })}><Languages size={16} aria-hidden="true" />{translating ? "Traduciendo carta…" : "Traducir ahora toda la carta"}</button>
          </div>
        </div>
      </section>
      <section role="tabpanel" id="appearance-panel-logo" aria-labelledby="appearance-tab-logo" hidden={tab !== "logo"} tabIndex={0} className="appearance-logo">
        {logoEditor}
        <p className="appearance-help">El logo se guarda al confirmar la subida.</p>
      </section>
      <div className="appearance-savebar" hidden={tab === "logo" && !dirty}>
        <p role="status">{saving ? "Guardando…" : dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}</p>
        <button type="submit" disabled={!dirty || saving || translating} className="workspace-button workspace-button-primary">{saving ? "Guardando…" : "Guardar preferencias"}</button>
      </div>
    </form>

    {preview && <dialog ref={dialog} className="appearance-dialog" aria-label={`Vista previa de ${MENU_TEMPLATES[preview].name}`}
      onCancel={() => setPreview(null)} onClose={() => setPreview(null)}
      onClick={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
      <div className="appearance-dialog-content">
        <div className="appearance-section-heading"><h2>{MENU_TEMPLATES[preview].name}</h2><button type="button" autoFocus onClick={() => setPreview(null)} aria-label="Cerrar vista previa"><X size={20} /></button></div>
        <TemplatePreview large kind={preview} {...previewProps} />
        <p className="appearance-help">{MENU_TEMPLATES[preview].description}</p>
      </div>
    </dialog>}
  </>;
}
