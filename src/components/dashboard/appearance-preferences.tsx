"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Languages, Lock, X } from "lucide-react";
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
  if (kind === "noirluxe")
    return (
      <div
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
          className={`absolute inset-x-0 top-0 z-10 flex items-start justify-between bg-gradient-to-b from-[#111111]/40 to-transparent ${large ? "px-6 pb-12 pt-8" : "px-3 pb-6 pt-3"}`}
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
          className={`absolute inset-x-0 z-10 flex overflow-hidden uppercase ${large ? `top-24 gap-7 px-6 ${NOIRLUXE_TOKENS.typography.category}` : "top-12 gap-3 px-3 text-[6px] leading-[8px] tracking-[.16em]"}`}
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
            className={`text-[#C9A96E] ${large ? `mt-4 ${NOIRLUXE_TOKENS.typography.dishName}` : "mt-2 font-[var(--font-noir-serif)] text-base font-normal italic leading-[18px]"}`}
          >
            {product?.name ?? "Producto destacado"}
          </p>
          <p
            className={`text-[#F0E9DB] ${large ? `mt-2 ${NOIRLUXE_TOKENS.typography.body}` : "mt-1 text-[6px] font-light leading-3"}`}
          >
            Una propuesta especial de nuestra cocina.
          </p>
          <div
            className={`flex items-center justify-between ${large ? "mt-5" : "mt-2"}`}
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
  if (kind === "street" || kind === "cozy-corner") {
    const street = kind === "street";
    const iconTheme = street ? "street" : "cozy-corner";
    return (
      <div
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
          className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 ${street ? (large ? "pt-8" : "pt-3") : large ? "h-[66px] bg-[#FF3B30]" : "h-[42px] bg-[#FF3B30]"}`}
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
          className={`absolute inset-x-4 z-10 flex gap-2 overflow-hidden ${street ? (large ? "top-24" : "top-12") : large ? "top-[78px]" : "top-[50px]"}`}
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

export function AppearancePreferences({
  enabled,
  template,
  canUsePremium,
  restaurantName,
  logoUrl,
  currency,
  previewProduct,
}: {
  enabled: boolean;
  template?: string;
  canUsePremium: boolean;
  restaurantName: string;
  logoUrl: string | null;
  currency: string;
  previewProduct?: PreviewProduct;
}) {
  const current = resolveMenuTemplate(template, canUsePremium);
  const [selected, setSelected] = useState<MenuTemplateKey>(current.key);
  const [preview, setPreview] = useState<MenuTemplateKey | null>(null);
  const [translating, startTranslation] = useTransition();
  useEffect(() => {
    if (!preview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    addEventListener("keydown", closeOnEscape);
    return () => removeEventListener("keydown", closeOnEscape);
  }, [preview]);
  return (
    <>
      <form
        action={async (form) => {
          try {
            const result = await updateAppearancePreferences(form);
            toast.success("Preferencias guardadas");
            notifyAutomaticTranslation(result.translationStatus);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "No se pudo guardar",
            );
          }
        }}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white shadow-sm p-5"
      >
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-bold">Plantillas de la carta</h2>
              <p className="mt-1 text-sm text-slate-600">
                Elige el estilo que mejor representa al restaurante.
              </p>
            </div>
            <span className="text-xs text-slate-500">4 disponibles</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.values(MENU_TEMPLATES).map((item) => {
              const locked = item.tier === "premium" && !canUsePremium;
              return (
                <article
                  key={item.key}
                  className={`rounded-2xl border p-3 transition ${item.key === selected ? "border-orange-500 bg-orange-50" : "border-stone-200 bg-stone-50"}`}
                >
                  <TemplatePreview
                    kind={item.key}
                    restaurantName={restaurantName}
                    logoUrl={logoUrl}
                    currency={currency}
                    product={previewProduct}
                  />
                  <div className="mt-3 flex items-start gap-2">
                    <label
                      className={`flex min-w-0 flex-1 gap-2 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      <input
                        aria-label={`Seleccionar plantilla ${item.name}`}
                        type="radio"
                        name="menu_template"
                        value={item.key}
                        checked={item.key === selected}
                        onChange={() => setSelected(item.key)}
                        disabled={locked}
                        className="mt-1 h-4 w-4 shrink-0 accent-orange-600"
                      />
                      <span className="min-w-0">
                        <strong className="block">{item.name}</strong>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                          {item.description}
                        </span>
                      </span>
                    </label>
                    {item.tier === "premium" && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[9px] font-bold uppercase text-amber-700">
                        <Lock size={10} />
                        Pro
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreview(item.key)}
                    aria-label={`Vista previa de ${item.name}`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold hover:bg-stone-100"
                  >
                    <Eye size={15} />
                    Vista previa
                  </button>
                </article>
              );
            })}
          </div>
          {!canUsePremium && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-50 p-3 text-xs text-slate-600">
              <span>
                Las plantillas premium están incluidas en los planes de pago.
              </span>
              <Link
                href="/dashboard/billing?from=templates"
                className="font-semibold text-amber-800"
              >
                Ver planes →
              </Link>
            </div>
          )}
        </section>
        <section className="border-t border-stone-200 pt-5">
          <h2 className="font-bold">Idiomas de la carta</h2>
          <p className="mt-1 text-sm text-slate-600">
            Permite cambiar los controles públicos entre español e inglés. El
            restaurante solo escribe en español.
          </p>
          <label className="mt-4 flex items-center gap-3">
            <input
              name="language_switcher_enabled"
              type="checkbox"
              defaultChecked={enabled}
              className="h-5 w-5 accent-orange-600"
            />
            <span>Mostrar selector de idioma</span>
          </label>
          <button
            type="button"
            disabled={translating}
            onClick={() =>
              startTranslation(async () => {
                try {
                  const result = await translateEntireMenu();
                  notifyAutomaticTranslation(result.translationStatus);
                  if (result.translationStatus === "translated")
                    toast.success(
                      `${result.translatedCount} elementos traducidos`,
                    );
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "No se pudo traducir la carta",
                  );
                }
              })
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] px-4 py-3 text-sm font-semibold text-cyan-800 disabled:opacity-50"
          >
            <Languages size={17} />
            {translating
              ? "Traduciendo carta…"
              : "Traducir ahora toda la carta"}
          </button>
        </section>
        <button className="w-full rounded-lg bg-orange-600 text-white px-4 py-3 font-semibold">
          Guardar preferencias
        </button>
      </form>

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa de ${MENU_TEMPLATES[preview].name}`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative w-full max-w-[390px]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Cerrar vista previa"
              className="absolute -right-1 -top-12 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950"
            >
              <X size={20} />
            </button>
            <TemplatePreview
              large
              kind={preview}
              restaurantName={restaurantName}
              logoUrl={logoUrl}
              currency={currency}
              product={previewProduct}
            />
            <p className="mt-3 text-center text-sm font-semibold text-white">
              {MENU_TEMPLATES[preview].name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
