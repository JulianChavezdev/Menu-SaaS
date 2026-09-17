"use client";
import "./marshmallow.css";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product, Restaurant } from "@/lib/types";
import { translatedField } from "@/lib/translations";
import { allergenLabel } from "@/lib/allergens";
import {
  addCartItem,
  cartLineKey,
  changeCartQuantity,
  parseCart,
  updateCartNote,
  type CartLine,
} from "@/lib/menu-cart";
import { marshmallowCartDetails } from "@/lib/marshmallow-cart";
import type { CustomizationSelection } from "@/lib/product-customization";
import type { AnalyticsEvent } from "@/lib/analytics";
import { safeExternalUrl } from "@/lib/safe-url";
import { ProductMedia } from "./product-media";
import { ProductCustomizer } from "./product-customizer";
import {
  TableOrderCheckout,
  type TableOrderingContext,
} from "./table-order-checkout";
import { useTableOrdering } from "./use-table-ordering";
import { useMenuScrollLock } from "./use-menu-scroll-lock";
import { MarshmallowIcon as Icon } from "./marshmallow-icons";

export type MarshmallowMenuProps = {
  restaurant: Restaurant;
  products: Product[];
  analyticsEnabled?: boolean;
  tableOrdering?: TableOrderingContext | null;
};

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="mm-sheet"
      aria-label={title}
      onCancel={onClose}
    >
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          className="mm-icon-button"
          aria-label="Cerrar / Close"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="mm-sheet-body">{children}</div>
    </dialog>
  );
}

function TreatMedia({
  product,
  enabled = true,
  onSeen,
  onPlay,
}: {
  product: Product;
  enabled?: boolean;
  onSeen?: () => void;
  onPlay?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [loaded, setLoaded] = useState(false);
  const events = useRef({ onSeen, onPlay });
  events.current = { onSeen, onPlay };
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setLoaded(true);
          events.current.onSeen?.();
        }
      },
      { threshold: 0.25 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="mm-treat-media" ref={ref}>
      {product.video_url ? (
        <ProductMedia
          index={0}
          name={product.name}
          src={loaded ? product.video_url : null}
          poster={product.image_url}
          active={visible && enabled}
          muted
          preload={visible ? "auto" : "none"}
          hydrated
          setVideoRef={() => {}}
          onPlaybackStarted={() => events.current.onPlay?.()}
          onMutedFallback={() => {}}
        />
      ) : (
        <Image
          src={product.image_url || "/templates/marshmallow/sundae.svg"}
          alt={product.image_url ? product.name : ""}
          fill
          sizes="(max-width:600px) 50vw, 330px"
          unoptimized
          className={
            product.image_url?.endsWith(".svg") || !product.image_url
              ? "mm-illustration"
              : "mm-photo"
          }
        />
      )}
    </div>
  );
}

export function MarshmallowMenu({
  restaurant,
  products: rawProducts,
  analyticsEnabled = true,
  tableOrdering: initialTableOrdering = null,
}: MarshmallowMenuProps) {
  useMenuScrollLock();
  const ordering = useTableOrdering(initialTableOrdering);
  const [language, setLanguage] = useState<"es" | "en">(
    restaurant.locale.startsWith("en") ? "en" : "es",
  );
  const es = language === "es";
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]),
    [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<"cart" | "info" | null>(null),
    [detail, setDetail] = useState<Product | null>(null),
    [customizing, setCustomizing] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState("");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<HTMLElement>(null),
    catalog = useRef<HTMLElement>(null);
  const tracked = useRef(new Set<string>());
  const products = useMemo(
    () => rawProducts.filter((p) => p.is_available),
    [rawProducts],
  );
  const name = (p: Product) => translatedField(p, "name", language, p.name);
  const description = (p: Product) =>
    translatedField(p, "description", language, p.description);
  const money = (value: number) =>
    new Intl.NumberFormat(es ? "es-ES" : "en-GB", {
      style: "currency",
      currency: restaurant.currency,
    }).format(value / 100);
  const cartKey = `carta-video:cart:${restaurant.id}`;
  const tableCode = ordering?.tableCode;
  const track = useCallback(
    (event: AnalyticsEvent["event"], productId?: string, once = false) => {
      const key = `${event}:${productId ?? "menu"}`;
      if (!analyticsEnabled || (once && tracked.current.has(key))) return;
      tracked.current.add(key);
      const body = JSON.stringify({
        restaurantId: restaurant.id,
        event,
        productId,
        locale: language,
      });
      if (
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon(
          "/api/analytics",
          new Blob([body], { type: "application/json" }),
        )
      )
        return;
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    },
    [analyticsEnabled, restaurant.id, language],
  );
  useEffect(() => {
    try {
      setCart(parseCart(localStorage.getItem(cartKey)));
    } catch {}
    setReady(true);
  }, [cartKey]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(cartKey, JSON.stringify(cart));
      } catch {}
  }, [cartKey, cart, ready]);
  useEffect(() => {
    if (!tableCode) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(`menuly:order:${tableCode}`) ?? "null",
      );
      if (
        saved?.token &&
        (!["delivered", "cancelled", "rejected"].includes(saved.status) ||
          (saved.status === "delivered" && saved.paymentStatus !== "paid"))
      )
        setPanel("cart");
    } catch {}
  }, [tableCode]);
  useEffect(() => {
    track("menu_view", undefined, true);
  }, [track]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );
  const details = marshmallowCartDetails(cart, rawProducts);
  const total = details.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
    quantity = cart.reduce((sum, line) => sum + line.quantity, 0);
  const categories = [
    ...new Map(
      products.map((p) => [
        p.category_id,
        {
          id: p.category_id,
          name: translatedField(
            p.categories ?? {},
            "name",
            language,
            p.categories?.name ?? (es ? "Especialidades" : "Specials"),
          ),
        },
      ]),
    ).values(),
  ];
  const displayed = products.filter(
    (p) =>
      (category === "all" || p.category_id === category) &&
      `${name(p)} ${description(p)}`
        .toLocaleLowerCase(language)
        .includes(query.trim().toLocaleLowerCase(language)),
  );
  const recommendations = detail
    ? products.filter(
        (p) =>
          (
            detail.recommended_product_ids ??
            detail.recommended_products?.map((r) => r.id) ??
            []
          ).includes(p.id) && p.id !== detail.id,
      )
    : [];
  const customizable = products.find((p) => p.customization?.enabled);
  function announce(message: string) {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 2600);
  }
  function add(product: Product, selection?: CustomizationSelection) {
    const key = cartLineKey({ productId: product.id, selection });
    if ((cart.find((line) => cartLineKey(line) === key)?.quantity ?? 0) >= 20) {
      announce(es ? "Máximo 20 unidades por producto" : "Maximum 20 per item");
      return;
    }
    setCart((current) => addCartItem(current, product.id, selection));
    track("cart_add", product.id);
    announce(es ? `${name(product)} en tu pedido` : `${name(product)} added`);
  }
  function choose(product: Product) {
    if (product.customization?.enabled) setCustomizing(product);
    else add(product);
  }
  function show(product: Product) {
    setDetail(product);
    track("detail_open", product.id, true);
  }
  const goToCatalog = () =>
    catalog.current?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  const restaurantName = translatedField(
    restaurant,
    "name",
    language,
    restaurant.name,
  );
  const website = safeExternalUrl(restaurant.website_url),
    instagram = safeExternalUrl(restaurant.instagram_url);

  return (
    <main
      className="mm-menu"
      data-template="marshmallow"
      aria-label={`${es ? "Carta de" : "Menu of"} ${restaurantName}`}
      ref={scroller}
    >
      <div className="mm-shell">
        <header className="mm-header">
          <button
            className="mm-brand"
            onClick={() => setPanel("info")}
            aria-label={`${es ? "Información de" : "About"} ${restaurantName}`}
          >
            {restaurant.logo_url ? (
              <Image
                src={restaurant.logo_url}
                width={42}
                height={42}
                unoptimized
                alt=""
              />
            ) : (
              <span className="mm-brand-mark">
                <Icon name="scoop" />
              </span>
            )}
            <span>
              {restaurantName}
              <small>
                {es ? "Un poquito de felicidad" : "A little scoop of happiness"}
              </small>
            </span>
          </button>
          <div className="mm-header-actions">
            {restaurant.language_switcher_enabled !== false && (
              <button
                className="mm-language"
                aria-label={es ? "Cambiar a inglés" : "Switch to Spanish"}
                onClick={() => setLanguage(es ? "en" : "es")}
              >
                {es ? "EN" : "ES"}
              </button>
            )}
            <button
              className="mm-icon-button mm-bag"
              aria-label={`${es ? "Abrir pedido" : "Open order"}: ${quantity}`}
              onClick={() => setPanel("cart")}
            >
              <Icon name="bag" />
              {quantity > 0 && <span>{quantity}</span>}
            </button>
          </div>
        </header>

        <section className="mm-hero">
          <div className="mm-hero-copy">
            <p className="mm-eyebrow">
              <span />{" "}
              {es ? "Pequeños grandes antojos" : "Little treats, big smiles"}
            </p>
            <h1>
              {es ? (
                <>
                  La vida pide
                  <br />
                  <em>algo dulce.</em>
                </>
              ) : (
                <>
                  Life tastes
                  <br />
                  <em>sweeter.</em>
                </>
              )}
            </h1>
            <p className="mm-hero-description">
              {es
                ? "Tu favorito, una cucharada y ese momento que es solo tuyo."
                : "Your favourite, a little spoon and a moment just for you."}
            </p>
            <button className="mm-button mm-primary" onClick={goToCatalog}>
              {es ? "Descubrir la carta" : "Explore the menu"}
              <Icon name="arrow" />
            </button>
          </div>
          <div className="mm-hero-art" aria-hidden="true">
            <div className="mm-art-oval" />
            <Image
              src="/templates/marshmallow/sundae.svg"
              alt=""
              width={460}
              height={460}
              priority
              unoptimized
            />
            <span className="mm-art-note">
              {es ? "una cucharada\nde alegría" : "a scoop\nof joy"}
              <svg viewBox="0 0 60 40">
                <path d="M3 4C8 31 33 38 53 24m-10 1 12-2-2 12" />
              </svg>
            </span>
            <span className="mm-hero-flower">
              <Icon name="flower" width={45} height={45} />
            </span>
          </div>
        </section>
        <div className="mm-ribbon" aria-hidden="true">
          <span>{es ? "A tu gusto" : "Just your style"}</span>
          <Icon name="flower" />
          <span>{es ? "Sin prisa" : "Take it slow"}</span>
          <Icon name="flower" />
          <span>{es ? "Con una sonrisa" : "With a smile"}</span>
          <Icon name="flower" />
        </div>

        <section className="mm-catalog" ref={catalog}>
          <div className="mm-catalog-heading">
            <div>
              <p className="mm-eyebrow">
                {es ? "El momento de elegir" : "Time to choose"}
              </p>
              <h2>{es ? "¿Qué te apetece?" : "What takes your fancy?"}</h2>
            </div>
            <span className="mm-count">
              {products.length} {es ? "antojos" : "treats"}
            </span>
          </div>
          <div className="mm-catalog-tools">
            <nav
              aria-label={es ? "Categorías" : "Categories"}
              className="mm-categories"
            >
              <button
                aria-pressed={category === "all"}
                onClick={() => setCategory("all")}
              >
                <Icon name="scoop" />
                {es ? "Todo" : "All"}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </nav>
            <label className="mm-search">
              <span className="sr-only">
                {es ? "Buscar en la carta" : "Search menu"}
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={es ? "Busca tu favorito…" : "Find your favourite…"}
              />
              <span aria-hidden="true">
                <Icon name="search" />
              </span>
            </label>
          </div>
          <div className="mm-grid">
            {displayed.map((product) => (
              <article
                className="mm-product"
                data-tint={product.sort_order % 4}
                key={product.id}
              >
                <div className="mm-product-visual">
                  <TreatMedia
                    product={product}
                    enabled={!detail && !panel && !customizing}
                    onSeen={() => track("product_view", product.id, true)}
                    onPlay={() => track("video_play", product.id, true)}
                  />
                  <button
                    className="mm-media-button"
                    aria-label={`${es ? "Ver" : "View"} ${name(product)}`}
                    onClick={() => show(product)}
                  />
                  {product.is_featured && (
                    <span className="mm-product-tag">
                      {es ? "Para enamorarse" : "Fall in love"}
                    </span>
                  )}
                  {product.customization?.enabled && (
                    <span className="mm-custom-tag">
                      <Icon name="flower" />
                      {es ? "A tu gusto" : "Your way"}
                    </span>
                  )}
                </div>
                <div className="mm-product-copy">
                  <button
                    className="mm-product-name"
                    onClick={() => show(product)}
                  >
                    <h3>{name(product)}</h3>
                  </button>
                  <p>{description(product)}</p>
                  <div className="mm-product-bottom">
                    <strong>{money(product.price_cents)}</strong>
                    <button
                      className="mm-add"
                      aria-label={`${product.customization?.enabled ? (es ? "Personalizar" : "Customize") : es ? "Añadir" : "Add"} ${name(product)}`}
                      onClick={() => choose(product)}
                    >
                      {product.customization?.enabled ? (
                        <span>{es ? "Crear" : "Create"}</span>
                      ) : (
                        <Icon name="plus" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!displayed.length && (
            <div className="mm-empty">
              <Icon name="scoop" width={40} height={40} />
              <h3>{es ? "No encontramos ese antojo" : "No treats found"}</h3>
              <button
                className="mm-button"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                }}
              >
                {es ? "Ver toda la carta" : "Show all treats"}
              </button>
            </div>
          )}
        </section>
        {customizable && (
          <section className="mm-build-banner">
            <div>
              <Icon name="flower" width={37} height={37} />
              <h2>{es ? "Tu antojo. Tus reglas." : "Your treat. Your way."}</h2>
              <p>
                {es
                  ? "Elige tus ingredientes y dale tu toque a"
                  : "Pick your ingredients and make it yours:"}{" "}
                <strong>{name(customizable)}</strong>.
              </p>
              <button
                className="mm-button"
                onClick={() => setCustomizing(customizable)}
              >
                {es ? "Voy a crear el mío" : "Make it my own"}
                <Icon name="arrow" />
              </button>
            </div>
            <Image
              src="/templates/marshmallow/fruit-bowl.svg"
              width={240}
              height={240}
              alt=""
              unoptimized
            />
          </section>
        )}
        <footer className="mm-footer">
          <Icon name="scoop" />
          <p>{restaurantName}</p>
          <span>
            {es
              ? "Nos vemos en la próxima cucharada."
              : "See you at the next scoop."}
          </span>
          <button onClick={() => setPanel("info")}>
            {es ? "Información y contacto" : "Information & contact"}
          </button>
          <small>menuly</small>
        </footer>
      </div>
      <div className="mm-order-dock">
        <button className="mm-dock-button" onClick={() => setPanel("cart")}>
          <span className="mm-dock-quantity">
            {quantity || <Icon name="bag" />}
          </span>
          <span>
            {quantity
              ? es
                ? "Mi pedido"
                : "My order"
              : es
                ? "Tu próximo antojo empieza aquí"
                : "Your next treat starts here"}
            <small>
              {ordering?.enabled
                ? ordering.tableName
                : es
                  ? "Elige algo que te haga sonreír"
                  : "Pick something that makes you smile"}
            </small>
          </span>
          <strong>{quantity ? money(total) : <Icon name="arrow" />}</strong>
        </button>
      </div>
      <div
        className="mm-feedback"
        role="status"
        aria-live="polite"
        data-visible={Boolean(feedback)}
      >
        {feedback}
      </div>

      {detail && (
        <Sheet title={name(detail)} onClose={() => setDetail(null)}>
          <div className="mm-detail-media">
            <TreatMedia
              product={detail}
              onPlay={() => track("video_play", detail.id, true)}
            />
          </div>
          <p className="mm-detail-description">{description(detail)}</p>
          <div className="mm-allergens">
            <h3>{es ? "Alérgenos" : "Allergens"}</h3>
            <p>
              {detail.allergens?.length
                ? detail.allergens
                    .map((a) => allergenLabel(a, language))
                    .join(" · ")
                : es
                  ? "Consulta con el personal."
                  : "Please check with staff."}
            </p>
            <small>
              {es
                ? "Si tienes una alergia, confirma siempre la información con el personal."
                : "If you have an allergy, always confirm the information with staff."}
            </small>
          </div>
          <button
            className="mm-button mm-primary mm-wide"
            onClick={() => {
              setDetail(null);
              choose(detail);
            }}
          >
            {detail.customization?.enabled
              ? es
                ? "Preparar a mi gusto"
                : "Make it my way"
              : es
                ? "Añadir al pedido"
                : "Add to order"}
            <strong>{money(detail.price_cents)}</strong>
          </button>
          {recommendations.length > 0 && (
            <section className="mm-recommendations">
              <h3>{es ? "Le va de maravilla" : "Lovely together"}</h3>
              {recommendations.map((p) => (
                <button key={p.id} onClick={() => show(p)}>
                  <span>{name(p)}</span>
                  <strong>{money(p.price_cents)}</strong>
                  <Icon name="arrow" />
                </button>
              ))}
            </section>
          )}
        </Sheet>
      )}
      {panel === "cart" && (
        <Sheet
          title={es ? "Tu pequeño capricho" : "Your little treat"}
          onClose={() => setPanel(null)}
        >
          {!cart.length && (
            <div className="mm-empty">
              <Icon name="bag" width={48} height={48} />
              <h3>
                {es
                  ? "Aquí caben cosas muy ricas"
                  : "Room for something lovely"}
              </h3>
              <p>
                {es
                  ? "Elige tus favoritos y guárdalos en tu pedido."
                  : "Choose your favourites and add them here."}
              </p>
              <button className="mm-button" onClick={() => setPanel(null)}>
                {es ? "Seguir mirando" : "Keep exploring"}
              </button>
            </div>
          )}
          {details.map((line) => (
            <article key={line.lineKey} className="mm-cart-line">
              <div className="mm-cart-title">
                <h3>
                  {line.product
                    ? name(line.product)
                    : es
                      ? "Producto no disponible"
                      : "Unavailable item"}
                </h3>
                <strong>{money(line.unitPrice * line.quantity)}</strong>
              </div>
              {line.options.length > 0 && (
                <div className="mm-cart-options">
                  {[...new Set(line.options.map((o) => o.groupId))].map(
                    (groupId) => (
                      <p key={groupId}>
                        <strong>
                          {
                            line.options.find((o) => o.groupId === groupId)!
                              .groupName
                          }
                          :
                        </strong>{" "}
                        {line.options
                          .filter((o) => o.groupId === groupId)
                          .map(
                            (o) =>
                              `${o.name}${o.priceCents ? ` (+${money(o.priceCents)})` : ""}`,
                          )
                          .join(", ")}
                      </p>
                    ),
                  )}
                </div>
              )}
              {line.invalid && (
                <p role="alert" className="mm-error">
                  {es
                    ? line.invalid
                    : "This item has changed. Remove it and choose again."}
                </p>
              )}
              <div className="mm-cart-actions">
                <div className="mm-stepper">
                  <button
                    aria-label={`${es ? "Quitar una unidad de" : "Remove one"} ${line.product?.name ?? "producto"}`}
                    onClick={() =>
                      setCart((c) => changeCartQuantity(c, line.lineKey, -1))
                    }
                  >
                    <Icon name="minus" />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    disabled={line.quantity >= 20 || !!line.invalid}
                    aria-label={`${es ? "Añadir una unidad de" : "Add one"} ${line.product?.name ?? "producto"}`}
                    onClick={() =>
                      setCart((c) => changeCartQuantity(c, line.lineKey, 1))
                    }
                  >
                    <Icon name="plus" />
                  </button>
                </div>
                <button
                  className="mm-remove"
                  onClick={() =>
                    setCart((c) =>
                      c.filter((l) => cartLineKey(l) !== line.lineKey),
                    )
                  }
                >
                  {es ? "Quitar" : "Remove"}
                </button>
              </div>
              <label className="mm-note-label">
                {es ? "Nota para este producto" : "Note for this item"}
                <input
                  value={line.note}
                  maxLength={300}
                  placeholder={
                    es ? "Por ejemplo: sin hielo" : "For example: no ice"
                  }
                  onChange={(e) =>
                    setCart((c) =>
                      updateCartNote(c, line.lineKey, e.target.value),
                    )
                  }
                />
              </label>
            </article>
          ))}
          {cart.length > 0 && (
            <div className="mm-cart-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
          )}
          {ordering ? (
            <div className="mm-checkout">
              <TableOrderCheckout
                context={ordering}
                lines={cart}
                language={language}
                accent="#99435B"
                background="#FFF9F0"
                invalid={details.some((l) => !!l.invalid)}
                onSent={() => setCart([])}
              />
              {ordering.enabled === false && (
                <p className="mm-cart-notice">
                  {es
                    ? "Esta carta es de consulta. Pide al personal para realizar tu pedido."
                    : "This is a browsing menu. Place your order with staff."}
                </p>
              )}
            </div>
          ) : (
            cart.length > 0 && (
              <p className="mm-cart-notice">
                {es
                  ? "Tu selección se guarda en este dispositivo. Muéstrasela al personal; no se envía a cocina."
                  : "Your selection is saved on this device. Show it to staff; it is not sent to the kitchen."}
              </p>
            )
          )}
        </Sheet>
      )}
      {panel === "info" && (
        <Sheet title={restaurantName} onClose={() => setPanel(null)}>
          <p className="mm-detail-description">
            {translatedField(
              restaurant,
              "description",
              language,
              restaurant.description,
            )}
          </p>
          {restaurant.address && (
            <p className="mm-contact-address">{restaurant.address}</p>
          )}
          <div className="mm-contact-links">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`}
                onClick={() => track("contact_click")}
              >
                {es ? "Llamar" : "Call"}
                <Icon name="arrow" />
              </a>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact_click")}
              >
                Web
                <Icon name="arrow" />
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact_click")}
              >
                Instagram
                <Icon name="arrow" />
              </a>
            )}
          </div>
        </Sheet>
      )}
      {customizing && (
        <ProductCustomizer
          product={{ ...customizing, name: name(customizing) }}
          currency={restaurant.currency}
          language={language}
          panel="#FFF9F0"
          accent="#99435B"
          onAccent="#FFF9F0"
          appearance="marshmallow"
          onClose={() => setCustomizing(null)}
          onConfirm={(selection) => {
            add(customizing, selection);
            setCustomizing(null);
          }}
        />
      )}
    </main>
  );
}
