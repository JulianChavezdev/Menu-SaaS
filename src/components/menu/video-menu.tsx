"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Info,
  Languages,
  List,
  MapPin,
  Minus,
  Phone,
  Plus,
  Share2,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { Product, Restaurant } from "@/lib/types";
import { resolveMenuTemplate } from "@/lib/menu-templates";
import { translatedField } from "@/lib/translations";
import { ThemeVectors } from "@/components/menu/theme-vectors";
import type { AnalyticsEvent } from "@/lib/analytics";
import { ProductMedia } from "@/components/menu/product-media";
import {
  addCartItem,
  changeCartQuantity,
  parseCart,
  updateCartNote,
  type CartLine,
} from "@/lib/menu-cart";
import { allergenLabel, type AllergenCode } from "@/lib/allergens";
import {
  TableOrderCheckout,
  type TableOrderingContext,
} from "@/components/menu/table-order-checkout";
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
  FigmaThemeProgress,
} from "@/components/menu/figma-theme-icons";
import {
  TokyoPulseAdd,
  TokyoPulseBasket,
  TokyoPulseHamburger,
  TokyoPulseTicker,
} from "@/components/menu/tokyo-pulse";

const copy = {
  es: {
    menu: "Carta",
    controls: "Controles",
    close: "Cerrar",
    share: "Compartir",
    info: "Restaurante",
    soundOn: "Activar sonido",
    soundOff: "Silenciar",
    website: "Visitar web",
    categories: "Categorías",
    featured: "Destacado",
    description: "Descripción",
    allergens: "Alérgenos",
    pairings: "Combina bien con",
    allergenNotice:
      "Si tienes una alergia, confirma siempre la información con el personal.",
    listHint: "Toca un plato para verlo en vídeo.",
    add: "Añadir",
    cart: "Carrito",
    emptyCart: "Tu carrito está vacío",
    total: "Total",
    note: "Observaciones",
    notePlaceholder: "Añade o quita ingredientes",
    remove: "Eliminar",
    saved: "Guardado en este dispositivo. No se envía a cocina.",
  },
  en: {
    menu: "Menu",
    controls: "Controls",
    close: "Close",
    share: "Share",
    info: "Restaurant",
    soundOn: "Turn sound on",
    soundOff: "Mute",
    website: "Visit website",
    categories: "Categories",
    featured: "Featured",
    description: "Description",
    allergens: "Allergens",
    pairings: "Pairs well with",
    allergenNotice:
      "If you have an allergy, always confirm the information with staff.",
    listHint: "Tap a dish to view its video.",
    add: "Add",
    cart: "Cart",
    emptyCart: "Your cart is empty",
    total: "Total",
    note: "Notes",
    notePlaceholder: "Add or remove ingredients",
    remove: "Remove",
    saved: "Saved on this device. It is not sent to the kitchen.",
  },
} as const;

function sendAnalytics(payload: AnalyticsEvent) {
  const body = JSON.stringify(payload);
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
  }).catch(() => undefined);
}

function revealExpandedDetails(details: HTMLDetailsElement) {
  if (!details.open) return;
  requestAnimationFrame(() => {
    const container = details.closest<HTMLElement>("[data-product-details]");
    if (!container) return;
    const bottom = details.offsetTop + details.offsetHeight;
    const visibleBottom = container.scrollTop + container.clientHeight;
    if (bottom > visibleBottom)
      container.scrollTo({
        top: bottom - container.clientHeight + 8,
        behavior: "smooth",
      });
  });
}

function safelyRewind(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
  try {
    video.currentTime = 0;
  } catch {}
}

export function VideoMenu({
  restaurant,
  products: rawProducts,
  analyticsEnabled = true,
  introEnabled = true,
  tableOrdering = null,
}: {
  restaurant: Restaurant;
  products: Product[];
  analyticsEnabled?: boolean;
  introEnabled?: boolean;
  tableOrdering?: TableOrderingContext | null;
}) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const feedRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<HTMLElement | null>(null);
  const categoryNavRef = useRef<HTMLElement | null>(null);
  const categoryButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const trackedMenu = useRef(false);
  const seenProducts = useRef(new Set<string>());
  const playedVideos = useRef(new Set<string>());
  const openedDetails = useRef(new Set<string>());
  const playingIndex = useRef<number | null>(null);
  const catalogFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const categorySwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryFinishTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const categoryAnimationFrame = useRef<number | null>(null);
  const categoryAnimating = useRef(false);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const [muted, setMuted] = useState(true);
  const [panel, setPanel] = useState<
    "controls" | "menu" | "info" | "cart" | null
  >(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [controlsClearance, setControlsClearance] = useState(80);
  const [catalogAdded, setCatalogAdded] = useState<string | null>(null);
  const hydrated = true;
  const [introVisible, setIntroVisible] = useState(
    Boolean(restaurant.logo_url) && introEnabled,
  );
  const [active, setActive] = useState(0);
  const [categorySlide, setCategorySlide] = useState<
    "idle" | "exit-left" | "exit-right" | "enter-left" | "enter-right"
  >("idle");
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(
    () => new Set(),
  );
  const [playbackBlocked, setPlaybackBlocked] = useState<Set<number>>(
    () => new Set(),
  );
  const [language, setLanguage] = useState<"es" | "en">(
    restaurant.locale.startsWith("en") ? "en" : "es",
  );
  const text = copy[language];
  const products = useMemo(
    () =>
      [
        ...rawProducts
          .reduce((groups, product) => {
            const current = groups.get(product.category_id);
            if (current) current.push(product);
            else groups.set(product.category_id, [product]);
            return groups;
          }, new Map<string, Product[]>())
          .values(),
      ].flat(),
    [rawProducts],
  );
  const template = resolveMenuTemplate(
    restaurant.menu_template,
    ["active", "trialing"].includes(restaurant.subscription_status ?? ""),
  );
  const framed = template.layout === "framed";
  const primaryTemplate = template.key === "cinematic";
  const noirLuxe = template.key === "noirluxe";
  const street = template.key === "street";
  const cozyCorner = template.key === "cozy-corner";
  const tokyoPulse = template.key === "tokyo-pulse";
  const figmaTheme = street || cozyCorner;
  const menuRailTheme = noirLuxe || figmaTheme || tokyoPulse;
  const figmaThemeKey = street ? "street" : "cozy-corner";
  const colors = template.colors;
  const sidebarPanel = cozyCorner ? "#C92F27" : colors.panel;
  const sidebarAccent = cozyCorner ? "#FFD600" : colors.accent;
  const sidebarFrame = cozyCorner ? "#FFD600" : colors.frame;
  const sidebarOnAccent = cozyCorner ? "#111111" : colors.background;
  const themeStyle = {
    "--theme-bg": colors.background,
    "--theme-panel": colors.panel,
    "--theme-nav": colors.nav,
    "--theme-accent": colors.accent,
    "--theme-accent-2": colors.accent2,
    "--theme-frame": colors.frame,
    "--controls-clearance": `${controlsClearance}px`,
    fontFamily: noirLuxe
      ? "var(--font-noir-sans)"
      : street
        ? "var(--font-street-sans)"
        : cozyCorner
          ? "var(--font-cozy-sans)"
          : tokyoPulse
            ? "var(--font-tokyo-sans)"
            : undefined,
  } as CSSProperties;
  const categoryGroups = [
    ...products
      .reduce((groups, product) => {
        const name = translatedField(
          product.categories ?? {},
          "name",
          language,
          product.categories?.name ?? text.menu,
        );
        const current = groups.get(product.category_id);
        if (current) current.products.push(product);
        else
          groups.set(product.category_id, {
            id: product.category_id,
            name,
            products: [product],
          });
        return groups;
      }, new Map<string, { id: string; name: string; products: Product[] }>())
      .values(),
  ];
  const activeCategory = products[active]?.category_id;
  const visibleProducts =
    categoryGroups.find((group) => group.id === activeCategory)?.products ??
    categoryGroups[0]?.products ??
    [];
  const categorySlideClass = {
    idle: "translate-x-0 opacity-100",
    "exit-left": "-translate-x-[105%] opacity-20",
    "exit-right": "translate-x-[105%] opacity-20",
    "enter-left": "-translate-x-[105%] opacity-20",
    "enter-right": "translate-x-[105%] opacity-20",
  }[categorySlide];
  const restaurantDescription = translatedField(
    restaurant,
    "description",
    language,
    restaurant.description,
  );
  const cartKey = `carta-video:cart:${restaurant.id}`;
  const currency = new Intl.NumberFormat(
    language === "es" ? "es-ES" : "en-US",
    { style: "currency", currency: restaurant.currency },
  );
  const cartDetails = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const cartQuantity = cartDetails.reduce(
    (total, line) => total + line.quantity,
    0,
  );
  const cartTotal = cartDetails.reduce(
    (total, line) => total + line.product.price_cents * line.quantity,
    0,
  );
  const trackVideoPlay = useCallback(
    (index: number) => {
      const product = products[index];
      if (
        !analyticsEnabled ||
        !product?.video_url ||
        playedVideos.current.has(product.id)
      )
        return;
      playedVideos.current.add(product.id);
      sendAnalytics({
        restaurantId: restaurant.id,
        productId: product.id,
        event: "video_play",
        locale: language,
      });
    },
    [analyticsEnabled, language, products, restaurant.id],
  );
  const playbackStarted = useCallback(
    (index: number) => {
      playingIndex.current = index;
      trackVideoPlay(index);
      setPlaybackBlocked((current) => {
        if (!current.has(index)) return current;
        const next = new Set(current);
        next.delete(index);
        return next;
      });
    },
    [trackVideoPlay],
  );
  const startVideo = useCallback(
    (video: HTMLVideoElement, index: number) => {
      video.muted = muted;
      const failed = () => {
        if (playingIndex.current === index) playingIndex.current = null;
        setPlaybackBlocked((current) => new Set(current).add(index));
      };
      void video
        .play()
        .then(() => playbackStarted(index))
        .catch(() => {
          if (video.muted) {
            failed();
            return;
          }
          video.muted = true;
          setMuted(true);
          void video
            .play()
            .then(() => playbackStarted(index))
            .catch(failed);
        });
    },
    [muted, playbackStarted],
  );

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.35)
            setActive(Number((entry.target as HTMLElement).dataset.index ?? 0));
        }),
      { root: feedRef.current, threshold: [0.35] },
    );
    sectionRefs.current.forEach(
      (section) => section && sectionObserver.observe(section),
    );
    const videoObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const index = Number(video.dataset.videoIndex);
          if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
            if (playingIndex.current === index && !video.paused && !video.ended)
              return;
            videoRefs.current.forEach((other) => {
              if (other && other !== video) {
                other.pause();
                safelyRewind(other);
              }
            });
            playingIndex.current = index;
            startVideo(video, index);
          } else {
            video.pause();
            safelyRewind(video);
            if (playingIndex.current === index) playingIndex.current = null;
          }
        }),
      { threshold: [0.45] },
    );
    const observedVideos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => Boolean(video),
    );
    observedVideos.forEach((video) => videoObserver.observe(video));
    return () => {
      sectionObserver.disconnect();
      videoObserver.disconnect();
      playingIndex.current = null;
      observedVideos.forEach((video) => video.pause());
    };
  }, [active, products, startVideo]);

  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    addEventListener("keydown", closeOnEscape);
    return () => removeEventListener("keydown", closeOnEscape);
  }, [panel]);
  useEffect(() => {
    if (!analyticsEnabled || trackedMenu.current) return;
    trackedMenu.current = true;
    sendAnalytics({
      restaurantId: restaurant.id,
      event: "menu_view",
      locale: language,
    });
  }, [analyticsEnabled, restaurant.id, language]);
  useEffect(() => {
    if (!analyticsEnabled) return;
    const product = products[active];
    if (!product || seenProducts.current.has(product.id)) return;
    seenProducts.current.add(product.id);
    sendAnalytics({
      restaurantId: restaurant.id,
      productId: product.id,
      event: "product_view",
      locale: language,
    });
  }, [active, analyticsEnabled, language, products, restaurant.id]);
  useEffect(() => {
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = "es";
    };
  }, [language]);
  useEffect(() => {
    setCart(parseCart(localStorage.getItem(cartKey)));
    setCartReady(true);
  }, [cartKey]);
  useEffect(() => {
    if (cartReady) localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey, cartReady]);
  useEffect(
    () => () => {
      if (catalogFeedbackTimer.current)
        clearTimeout(catalogFeedbackTimer.current);
      if (categorySwapTimer.current) clearTimeout(categorySwapTimer.current);
      if (categoryFinishTimer.current)
        clearTimeout(categoryFinishTimer.current);
      if (categoryAnimationFrame.current)
        cancelAnimationFrame(categoryAnimationFrame.current);
    },
    [],
  );
  useEffect(() => {
    const feed = feedRef.current;
    const controls = controlsRef.current;
    if (!feed || !controls) return;
    const update = () => {
      const feedBox = feed.getBoundingClientRect();
      const controlsBox = controls.getBoundingClientRect();
      setControlsClearance(Math.ceil(feedBox.bottom - controlsBox.top + 16));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(feed);
    observer.observe(controls);
    addEventListener("resize", update);
    visualViewport?.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      removeEventListener("resize", update);
      visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => setIntroVisible(false),
      reduced ? 450 : 1800,
    );
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const nav = categoryNavRef.current;
    const button = activeCategory
      ? categoryButtonRefs.current.get(activeCategory)
      : null;
    if (!nav || !button) return;
    nav.scrollTo({
      left: button.offsetLeft - (nav.clientWidth - button.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeCategory]);
  useEffect(() => {
    if (activeCategory)
      feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeCategory]);

  const share = async () => {
    let completed = false;
    try {
      await navigator.share({ title: restaurant.name, url: location.href });
      completed = true;
    } catch {
      try {
        await navigator.clipboard.writeText(location.href);
        completed = true;
      } catch {
        completed = false;
      }
    }
    if (completed && analyticsEnabled)
      sendAnalytics({
        restaurantId: restaurant.id,
        event: "share",
        locale: language,
      });
  };
  const go = (id: string, direct = false) => {
    const scroll = (target: HTMLElement) => {
      if (direct && feedRef.current)
        feedRef.current.scrollTo({
          top: target.offsetTop,
          behavior: "instant",
        });
      else target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const target = document.getElementById(id);
    if (target) scroll(target);
    else {
      const productId = id.replace(/^product-/, "");
      const index = products.findIndex((product) => product.id === productId);
      if (index >= 0) {
        setActive(index);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const rendered = document.getElementById(id);
            if (rendered) scroll(rendered);
          }),
        );
      }
    }
    setPanel(null);
  };
  const openCategory = (categoryId: string, requestedDirection?: -1 | 1) => {
    const index = products.findIndex(
      (product) => product.category_id === categoryId,
    );
    if (index < 0 || categoryAnimating.current) return false;
    const currentCategoryIndex = Math.max(
      0,
      categoryGroups.findIndex((group) => group.id === activeCategory),
    );
    const targetCategoryIndex = categoryGroups.findIndex(
      (group) => group.id === categoryId,
    );
    if (targetCategoryIndex === currentCategoryIndex) {
      feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setPanel(null);
      return false;
    }
    const direction =
      requestedDirection ??
      (targetCategoryIndex > currentCategoryIndex ? 1 : -1);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(index);
      requestAnimationFrame(() =>
        feedRef.current?.scrollTo({ top: 0, behavior: "instant" }),
      );
      setPanel(null);
      return true;
    }
    categoryAnimating.current = true;
    setCategorySlide(direction === 1 ? "exit-left" : "exit-right");
    categorySwapTimer.current = setTimeout(() => {
      setActive(index);
      feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
      setCategorySlide(direction === 1 ? "enter-right" : "enter-left");
      categoryAnimationFrame.current = requestAnimationFrame(() => {
        categoryAnimationFrame.current = requestAnimationFrame(() =>
          setCategorySlide("idle"),
        );
      });
      categoryFinishTimer.current = setTimeout(() => {
        categoryAnimating.current = false;
      }, 280);
    }, 240);
    setPanel(null);
    return true;
  };
  const changeCategory = (direction: -1 | 1) => {
    const current = Math.max(
      0,
      categoryGroups.findIndex((group) => group.id === activeCategory),
    );
    const next = Math.max(
      0,
      Math.min(categoryGroups.length - 1, current + direction),
    );
    if (next === current) return false;
    return openCategory(categoryGroups[next].id, direction);
  };
  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    gestureStart.current = touch
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = gestureStart.current;
    gestureStart.current = null;
    const touch = event.changedTouches[0];
    if (start && touch) {
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        changeCategory(dx < 0 ? 1 : -1);
        resumeActiveVideo();
        return;
      }
      const feed = feedRef.current;
      const atBottom = Boolean(
        feed && feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 4,
      );
      const atTop = Boolean(feed && feed.scrollTop <= 4);
      if (dy < -55 && atBottom) changeCategory(1);
      else if (dy > 55 && atTop) changeCategory(-1);
    }
    resumeActiveVideo();
  };
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch")
      gestureStart.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") {
      resumeActiveVideo();
      return;
    }
    const start = gestureStart.current;
    gestureStart.current = null;
    if (start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
        changeCategory(dx < 0 ? 1 : -1);
      else {
        const feed = feedRef.current;
        const atBottom = Boolean(
          feed && feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 4,
        );
        const atTop = Boolean(feed && feed.scrollTop <= 4);
        if (dy < -55 && atBottom) changeCategory(1);
        else if (dy > 55 && atTop) changeCategory(-1);
      }
    }
    resumeActiveVideo();
  };
  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (
      Math.abs(event.deltaX) > Math.abs(event.deltaY) &&
      Math.abs(event.deltaX) > 30
    ) {
      changeCategory(event.deltaX > 0 ? 1 : -1);
      return;
    }
    const feed = feedRef.current;
    if (!feed) return;
    if (
      event.deltaY > 30 &&
      feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 4
    )
      changeCategory(1);
    else if (event.deltaY < -30 && feed.scrollTop <= 4) changeCategory(-1);
  };
  const back = () =>
    history.length > 1 ? history.back() : location.assign("/");
  const resumeActiveVideo = useCallback(() => {
    if (introVisible) return;
    const video = videoRefs.current[active];
    if (!video || !products[active]?.video_url) return;
    if (
      video.error ||
      video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
    )
      video.load();
    startVideo(video, active);
  }, [active, introVisible, products, startVideo]);
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible") resumeActiveVideo();
    };
    document.addEventListener("visibilitychange", resume);
    addEventListener("pageshow", resume);
    addEventListener("online", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      removeEventListener("pageshow", resume);
      removeEventListener("online", resume);
    };
  }, [resumeActiveVideo]);
  const addProduct = (productId: string) => {
    setCart((current) => addCartItem(current, productId));
    if (analyticsEnabled)
      sendAnalytics({
        restaurantId: restaurant.id,
        productId,
        event: "cart_add",
        locale: language,
      });
  };
  const addFromCatalog = (productId: string) => {
    addProduct(productId);
    setCatalogAdded(productId);
    if (catalogFeedbackTimer.current)
      clearTimeout(catalogFeedbackTimer.current);
    catalogFeedbackTimer.current = setTimeout(() => setCatalogAdded(null), 900);
  };
  const addRecommendation = (productId: string) => {
    addFromCatalog(productId);
    if (analyticsEnabled)
      sendAnalytics({
        restaurantId: restaurant.id,
        productId,
        event: "recommendation_add",
        locale: language,
      });
  };
  const toggleDetails = (productId: string, details: HTMLDetailsElement) => {
    setExpandedDetails((current) => {
      const next = new Set(current);
      if (details.open) next.add(productId);
      else next.delete(productId);
      return next;
    });
    revealExpandedDetails(details);
    if (
      details.open &&
      analyticsEnabled &&
      !openedDetails.current.has(productId)
    ) {
      openedDetails.current.add(productId);
      sendAnalytics({
        restaurantId: restaurant.id,
        productId,
        event: "detail_open",
        locale: language,
      });
    }
  };

  return (
    <main
      ref={feedRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      aria-label={`Carta de ${restaurant.name}`}
      data-template={template.key}
      data-hydrated={hydrated ? "true" : "false"}
      style={themeStyle}
      className="public-menu relative h-svh snap-y snap-mandatory overflow-y-auto overscroll-none scroll-smooth bg-[var(--theme-bg)] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-auto md:max-w-[402px]"
    >
      <h1 className="sr-only">{restaurant.name}: carta en vídeo</h1>
      {introVisible && restaurant.logo_url && (
        <div
          data-menu-intro
          role="status"
          aria-label={`Abriendo la carta de ${restaurant.name}`}
          style={{ background: colors.background }}
          className="fixed inset-0 z-[70] grid place-items-center overflow-hidden p-8 text-center"
        >
          <button
            type="button"
            aria-label="Abrir carta"
            onClick={() => setIntroVisible(false)}
            className="grid h-44 w-full place-items-center"
          >
            <span
              role="img"
              aria-label={`Logo de ${restaurant.name}`}
              style={{ backgroundImage: `url(${restaurant.logo_url})` }}
              className="h-full w-full max-w-[280px] bg-contain bg-center bg-no-repeat"
            />
          </button>
        </div>
      )}
      {menuRailTheme ? (
        <header
          style={{
            background: cozyCorner
              ? "#FF3B30"
              : noirLuxe
                ? "linear-gradient(to bottom,rgba(17,17,17,.4),rgba(17,17,17,.4),transparent)"
                : tokyoPulse
                  ? "linear-gradient(to bottom,rgba(26,13,20,.96),rgba(26,13,20,.72),transparent)"
                  : "linear-gradient(to bottom,rgba(17,17,17,.68),rgba(17,17,17,.28),transparent)",
          }}
          className={`pointer-events-none fixed left-0 right-0 top-0 z-30 mx-auto flex max-w-[430px] items-start justify-between px-6 md:max-w-[402px] ${cozyCorner ? "h-[max(88px,calc(env(safe-area-inset-top)+52px))] pb-2 pt-[max(1rem,calc(env(safe-area-inset-top)+.25rem))]" : tokyoPulse ? "pb-3 pt-[max(.65rem,calc(env(safe-area-inset-top)+.15rem))]" : "pb-6 pt-[max(1rem,calc(env(safe-area-inset-top)+.25rem))]"}`}
        >
          <button
            aria-label={text.controls}
            onClick={() => setPanel("controls")}
            className="pointer-events-auto grid size-11 place-items-center"
          >
            {noirLuxe ? (
              <NoirLuxeHamburgerIcon />
            ) : tokyoPulse ? (
              <TokyoPulseHamburger />
            ) : (
              <FigmaThemeHamburger theme={figmaThemeKey} />
            )}
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            {restaurant.logo_url && (
              <span
                role="img"
                aria-label={`Logo de ${restaurant.name}`}
                className={`mx-auto block bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.9)] ${tokyoPulse ? "h-9 w-40" : "h-12 w-48"}`}
                style={{ backgroundImage: `url(${restaurant.logo_url})` }}
              />
            )}
          </div>
          <button
            aria-label={`${text.cart}: ${cartQuantity}`}
            onClick={() => setPanel("cart")}
            className="pointer-events-auto relative grid size-11 place-items-center"
          >
            {noirLuxe ? (
              <NoirLuxeBasketIcon />
            ) : tokyoPulse ? (
              <TokyoPulseBasket />
            ) : (
              <FigmaThemeBasket theme={figmaThemeKey} />
            )}
            {cartQuantity > 0 && (
              <span
                style={{
                  background: sidebarAccent,
                  color: sidebarOnAccent,
                }}
                className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center px-1 text-[9px] font-bold"
              >
                {cartQuantity}
              </span>
            )}
          </button>
        </header>
      ) : (
        <header
          style={{
            background: `linear-gradient(to bottom,${colors.background}f2,${colors.background}a8,transparent)`,
          }}
          className="pointer-events-none fixed left-0 right-0 top-0 z-30 mx-auto flex max-w-[430px] items-center justify-between px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] md:max-w-[402px]"
        >
          <button
            aria-label="Volver"
            onClick={back}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex min-w-0 flex-1 justify-center px-3">
            {restaurant.logo_url && (
              <span
                role="img"
                aria-label={`Logo de ${restaurant.name}`}
                className="h-14 w-44 bg-contain bg-center bg-no-repeat drop-shadow-[0_3px_12px_rgba(0,0,0,.95)]"
                style={{ backgroundImage: `url(${restaurant.logo_url})` }}
              />
            )}
          </div>
          {restaurant.language_switcher_enabled ? (
            <button
              aria-label={
                language === "es" ? "Cambiar a inglés" : "Switch to Spanish"
              }
              onClick={() =>
                setLanguage((value) => (value === "es" ? "en" : "es"))
              }
              className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 text-xs font-bold backdrop-blur-md"
            >
              <Languages size={17} />
              {language.toUpperCase()}
            </button>
          ) : (
            <span className="h-10 w-10" />
          )}
        </header>
      )}

      {!menuRailTheme && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 md:right-[calc((100vw-402px)/2+12px)]"
        >
          {visibleProducts.map((product) => {
            const index = products.findIndex((item) => item.id === product.id);
            return (
              <span
                key={product.id}
                style={{
                  background:
                    index === active ? colors.accent : "rgba(255,255,255,.4)",
                }}
                className={`w-1 rounded-full transition-all ${active === index ? "h-6" : "h-1"}`}
              />
            );
          })}
        </div>
      )}
      {figmaTheme && (
        <div className="pointer-events-none fixed right-3 top-1/2 z-20 -translate-y-1/2 md:right-[calc((100vw-402px)/2+12px)]">
          <FigmaThemeProgress theme={figmaThemeKey} />
        </div>
      )}
      {tokyoPulse && (
        <div className="pointer-events-none fixed right-3 top-1/2 z-20 -translate-y-1/2 md:right-[calc((100vw-402px)/2+12px)]">
          <span
            style={{ writingMode: "vertical-rl" }}
            className="border-l border-[#7CC7A1] pl-2 font-[var(--font-tokyo-sans)] text-[9px] font-bold tracking-[.3em] text-[#FFF1D7]"
          >
            おすすめ
          </span>
        </div>
      )}

      {panel === "controls" && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-stretch justify-start bg-black/65 backdrop-blur-sm md:max-w-[402px]"
          onClick={() => setPanel(null)}
        >
          <aside
            aria-label={text.controls}
            style={{ background: sidebarPanel, borderColor: sidebarFrame }}
            className="flex h-full w-[104px] flex-col items-center border-r px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,calc(env(safe-area-inset-top)+.75rem))] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label={text.close}
              onClick={() => setPanel(null)}
              style={{ borderColor: sidebarFrame, color: sidebarAccent }}
              className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
            >
              <X size={23} />
            </button>
            <nav
              aria-label={text.controls}
              className="mt-5 flex w-full flex-col items-center gap-2"
            >
              <button
                aria-label={text.menu}
                title={text.menu}
                onClick={() => setPanel("menu")}
                style={{ borderColor: sidebarFrame, color: sidebarAccent }}
                className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
              >
                <List size={23} />
              </button>
              <button
                aria-label={muted ? text.soundOn : text.soundOff}
                title={muted ? text.soundOn : text.soundOff}
                onClick={() => setMuted((value) => !value)}
                style={{ borderColor: sidebarFrame, color: sidebarAccent }}
                className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
              >
                {muted ? <VolumeX size={23} /> : <Volume2 size={23} />}
              </button>
              <button
                aria-label={text.info}
                title={text.info}
                onClick={() => setPanel("info")}
                style={{ borderColor: sidebarFrame, color: sidebarAccent }}
                className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
              >
                <Info size={23} />
              </button>
              <button
                aria-label={text.share}
                title={text.share}
                onClick={share}
                style={{ borderColor: sidebarFrame, color: sidebarAccent }}
                className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
              >
                <Share2 size={23} />
              </button>
              {restaurant.language_switcher_enabled && (
                <button
                  aria-label={
                    language === "es" ? "Cambiar a inglés" : "Switch to Spanish"
                  }
                  title={language === "es" ? "English" : "Español"}
                  onClick={() =>
                    setLanguage((value) => (value === "es" ? "en" : "es"))
                  }
                  style={{ borderColor: sidebarFrame, color: sidebarAccent }}
                  className="grid size-12 place-items-center border bg-[var(--theme-panel)] transition active:scale-95"
                >
                  <Languages size={23} />
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}

      {panel && panel !== "controls" && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/65 p-3 backdrop-blur-sm md:max-w-[402px]"
          onClick={() => setPanel(null)}
        >
          <aside
            aria-label={
              panel === "menu"
                ? text.menu
                : panel === "cart"
                  ? text.cart
                  : text.info
            }
            style={{ background: sidebarPanel, borderColor: sidebarFrame }}
            className="flex max-h-[88vh] max-h-[88dvh] w-full flex-col rounded-xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between">
              <div>
                <p
                  style={{ color: sidebarAccent }}
                  className="text-xs font-bold uppercase tracking-[.2em]"
                >
                  {restaurant.name}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {panel === "menu"
                    ? text.menu
                    : panel === "cart"
                      ? `${text.cart}${cartQuantity ? ` · ${cartQuantity}` : ""}`
                      : text.info}
                </h2>
              </div>
              <button
                aria-label={text.close}
                onClick={() => setPanel(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            {panel === "menu" ? (
              <div className="mt-3 min-h-0 overflow-y-auto pr-1">
                <p className="mb-3 text-[11px] text-white/55">
                  {text.listHint}
                </p>
                <p aria-live="polite" className="sr-only">
                  {catalogAdded
                    ? `${products.find((product) => product.id === catalogAdded)?.name ?? "Producto"} ${language === "es" ? "añadido al carrito" : "added to cart"}`
                    : ""}
                </p>
                <div className="space-y-4">
                  {categoryGroups.map((group) => (
                    <section key={group.id}>
                      <h3
                        style={{ color: sidebarAccent }}
                        className="mb-2 text-[10px] font-bold uppercase tracking-[.14em]"
                      >
                        {group.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {group.products.map((product) => {
                          const added = catalogAdded === product.id;
                          return (
                            <article
                              key={product.id}
                              className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[.04]"
                            >
                              <button
                                type="button"
                                aria-label={`Ver ${product.name}`}
                                onClick={() => go(`product-${product.id}`)}
                                className="relative block aspect-[4/3] w-full overflow-hidden bg-black/30"
                              >
                                {product.image_url ? (
                                  <span
                                    role="img"
                                    aria-label={product.name}
                                    style={{
                                      backgroundImage: `url(${product.image_url})`,
                                    }}
                                    className="block h-full w-full bg-cover bg-center"
                                  />
                                ) : (
                                  <span className="grid h-full place-items-center bg-gradient-to-br from-white/10 to-black/30 text-white/45">
                                    <List size={20} />
                                  </span>
                                )}
                                <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                              </button>
                              <div className="p-2">
                                <button
                                  type="button"
                                  onClick={() => go(`product-${product.id}`)}
                                  className="line-clamp-1 w-full text-left text-xs font-semibold leading-tight"
                                >
                                  {translatedField(
                                    product,
                                    "name",
                                    language,
                                    product.name,
                                  )}
                                </button>
                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                  <strong
                                    style={{ color: sidebarAccent }}
                                    className="text-xs tabular-nums"
                                  >
                                    {currency.format(product.price_cents / 100)}
                                  </strong>
                                  <button
                                    type="button"
                                    aria-label={
                                      added
                                        ? `${product.name} añadido al carrito`
                                        : `${text.add} ${product.name}`
                                    }
                                    onClick={() => addFromCatalog(product.id)}
                                    style={{
                                      background: sidebarAccent,
                                      color: sidebarOnAccent,
                                    }}
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-200 ${added ? "scale-110" : "active:scale-90"}`}
                                  >
                                    {added ? (
                                      <Check size={15} strokeWidth={3} />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ) : panel === "cart" ? (
              <div className="mt-5 min-h-0 overflow-y-auto pr-1">
                {cartDetails.length === 0 ? (
                  <div className="grid place-items-center py-12 text-center text-white/60">
                    <ShoppingBag size={36} />
                    <p className="mt-3">{text.emptyCart}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartDetails.map(({ product, quantity, note }) => (
                      <article
                        key={product.id}
                        className="border-b border-white/10 pb-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {translatedField(
                                product,
                                "name",
                                language,
                                product.name,
                              )}
                            </h3>
                            <p
                              style={{ color: sidebarAccent }}
                              className="mt-1 text-sm font-semibold"
                            >
                              {currency.format(product.price_cents / 100)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center rounded-full border border-white/15 bg-black/15 p-1">
                            <button
                              aria-label={`Quitar una unidad de ${product.name}`}
                              onClick={() =>
                                setCart((current) =>
                                  changeCartQuantity(current, product.id, -1),
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-7 text-center text-sm font-bold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              aria-label={`Añadir una unidad de ${product.name}`}
                              onClick={() => addProduct(product.id)}
                              className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                        <label className="mt-3 block text-xs font-medium text-white/65">
                          {text.note}
                          <textarea
                            value={note}
                            maxLength={300}
                            onChange={(event) =>
                              setCart((current) =>
                                updateCartNote(
                                  current,
                                  product.id,
                                  event.target.value,
                                ),
                              )
                            }
                            placeholder={text.notePlaceholder}
                            className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
                          />
                        </label>
                        <button
                          onClick={() =>
                            setCart((current) =>
                              current.filter(
                                (line) => line.productId !== product.id,
                              ),
                            )
                          }
                          className="mt-2 flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
                        >
                          <Trash2 size={14} />
                          {text.remove}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                {cartDetails.length > 0 && (
                  <div className="sticky bottom-0 mt-4 border-t border-white/15 bg-[var(--theme-panel)] pt-4">
                    <div className="flex items-center justify-between text-lg">
                      <span>{text.total}</span>
                      <strong style={{ color: sidebarAccent }}>
                        {currency.format(cartTotal / 100)}
                      </strong>
                    </div>
                    {tableOrdering ? (
                      <TableOrderCheckout
                        context={tableOrdering}
                        lines={cart}
                        language={language}
                        accent={sidebarAccent}
                        background={colors.background}
                        onSent={() => setCart([])}
                      />
                    ) : (
                      <p className="mt-2 text-xs leading-relaxed text-white/55">
                        {text.saved}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-4 overflow-y-auto text-sm leading-relaxed text-white/70">
                {restaurantDescription && <p>{restaurantDescription}</p>}
                {restaurant.address && (
                  <p className="flex gap-3">
                    <MapPin
                      style={{ color: sidebarAccent }}
                      className="mt-0.5 shrink-0"
                      size={18}
                    />
                    <span>{restaurant.address}</span>
                  </p>
                )}
                {restaurant.phone && (
                  <a
                    className="flex gap-3 text-white"
                    href={`tel:${restaurant.phone}`}
                    onClick={() =>
                      analyticsEnabled &&
                      sendAnalytics({
                        restaurantId: restaurant.id,
                        event: "contact_click",
                        locale: language,
                      })
                    }
                  >
                    <Phone
                      style={{ color: sidebarAccent }}
                      className="shrink-0"
                      size={18}
                    />
                    {restaurant.phone}
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  {restaurant.instagram_url && (
                    <a
                      className="rounded-full border border-white/15 px-4 py-2"
                      target="_blank"
                      rel="noreferrer"
                      href={restaurant.instagram_url}
                      onClick={() =>
                        analyticsEnabled &&
                        sendAnalytics({
                          restaurantId: restaurant.id,
                          event: "contact_click",
                          locale: language,
                        })
                      }
                    >
                      Instagram
                    </a>
                  )}
                  {restaurant.website_url && (
                    <a
                      className="rounded-full border border-white/15 px-4 py-2"
                      target="_blank"
                      rel="noreferrer"
                      href={restaurant.website_url}
                      onClick={() =>
                        analyticsEnabled &&
                        sendAnalytics({
                          restaurantId: restaurant.id,
                          event: "contact_click",
                          locale: language,
                        })
                      }
                    >
                      {text.website}
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      <div
        data-category-slide={categorySlide}
        className={`will-change-transform ${categorySlide.startsWith("enter-") ? "transition-none" : "transition-[transform,opacity] duration-[240ms] ease-out"} ${categorySlideClass}`}
      >
        {visibleProducts.map((product) => {
          const index = products.findIndex((item) => item.id === product.id);
          const description = translatedField(
            product,
            "description",
            language,
            product.description,
          );
          const categoryName = translatedField(
            product.categories ?? {},
            "name",
            language,
            product.categories?.name ?? text.menu,
          );
          const allergens = (product.allergens ?? []) as AllergenCode[];
          const recommendations =
            product.recommended_products?.filter((item) => item.is_available) ??
            [];
          return (
            <section
              ref={(element) => {
                sectionRefs.current[index] = element;
              }}
              data-index={index}
              id={`product-${product.id}`}
              key={product.id}
              className={`relative isolate flex h-svh snap-start snap-always items-end overflow-hidden bg-[var(--theme-bg)] ${noirLuxe ? "px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-40 [font-family:var(--font-noir-sans)]" : figmaTheme ? "px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-44" : tokyoPulse ? "px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-36" : "px-4 pb-[var(--controls-clearance)] pt-24"}`}
            >
              <div
                style={{ borderColor: colors.frame }}
                className={`absolute z-0 overflow-hidden bg-[#22221f] ${framed ? "inset-3 bottom-16 rounded-xl border shadow-2xl" : "inset-0"}`}
              >
                <ProductMedia
                  index={index}
                  name={product.name}
                  src={product.video_url}
                  poster={product.image_url}
                  muted={muted}
                  preload={Math.abs(index - active) <= 1 ? "auto" : "metadata"}
                  active={index === active}
                  hydrated={Math.abs(index - active) <= 1}
                  playbackBlocked={playbackBlocked.has(index)}
                  setVideoRef={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  onPlaybackStarted={playbackStarted}
                />
              </div>
              {template.key !== "cinematic" && (
                <div
                  className={`absolute z-[1] ${framed ? "inset-3 bottom-16 rounded-xl" : "inset-0"}`}
                  style={{
                    background: noirLuxe
                      ? "linear-gradient(180deg,rgba(17,17,17,.4) 0%,rgba(17,17,17,.08) 42%,rgba(17,17,17,.4) 62%,#111111 100%)"
                      : street
                        ? "linear-gradient(180deg,rgba(17,17,17,.52) 0%,rgba(17,17,17,.04) 38%,rgba(17,17,17,.12) 52%,#111111 100%)"
                        : cozyCorner
                          ? "linear-gradient(180deg,rgba(17,17,17,.2) 17%,rgba(17,17,17,.02) 42%,rgba(17,17,17,.08) 58%,rgba(17,17,17,.94) 100%)"
                          : tokyoPulse
                            ? "linear-gradient(180deg,rgba(26,13,20,.58) 0%,rgba(26,13,20,.03) 38%,rgba(26,13,20,.25) 58%,#1A0D14 100%)"
                            : `linear-gradient(180deg,${colors.background}66 0%,transparent 32%,transparent 45%,${colors.background}f2 100%)`,
                  }}
                />
              )}
              {cozyCorner && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[max(88px,calc(env(safe-area-inset-top)+52px))] z-[2] border-y-[8px] border-dashed border-[#FF3B30]" />
              )}
              <ThemeVectors
                motif={template.motif}
                accent={colors.accent}
                accent2={colors.accent2}
                className="absolute inset-0 z-[2] h-full w-full"
              />
              {primaryTemplate && expandedDetails.has(product.id) && (
                <div
                  data-description-backdrop
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[58%] bg-gradient-to-t from-black/95 via-black/65 to-transparent"
                />
              )}
              <div
                data-product-details
                className={`relative z-10 w-full overflow-y-auto overscroll-contain pb-0.5 text-shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${noirLuxe ? "max-h-[calc(100dvh-10.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]" : "max-h-[calc(100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"}`}
              >
                {tokyoPulse ? (
                  <>
                    <div className="flex min-h-10 items-center justify-between gap-4">
                      <span className="border-l-4 border-[#FF5A36] pl-2 font-[var(--font-tokyo-sans)] text-[9px] font-bold uppercase tracking-[.2em] text-[#7CC7A1]">
                        {product.is_featured ? text.featured : categoryName}
                      </span>
                      <button
                        aria-label={`${text.add} ${product.name}`}
                        title={text.add}
                        onClick={() => addProduct(product.id)}
                        className="shrink-0 transition active:scale-90"
                      >
                        <TokyoPulseAdd />
                      </button>
                    </div>
                    <h2 className="max-w-[20rem] font-[var(--font-tokyo-serif)] text-[27px] font-semibold leading-8 text-[#FFF1D7]">
                      {translatedField(product, "name", language, product.name)}
                    </h2>
                    {(description ||
                      allergens.length > 0 ||
                      recommendations.length > 0) && (
                      <details
                        onToggle={(event) =>
                          toggleDetails(product.id, event.currentTarget)
                        }
                        className="group mt-1 text-[#FFF1D7]"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-1 font-[var(--font-tokyo-sans)] text-[10px] font-bold uppercase tracking-[.16em] text-[#7CC7A1]">
                          {text.description}
                          <ChevronDown
                            size={12}
                            className="transition-transform group-open:rotate-180"
                          />
                        </summary>
                        {description && (
                          <p className="mt-1 text-[11px] leading-4 text-[#FFF1D7]/85">
                            {description}
                          </p>
                        )}
                        {allergens.length > 0 && (
                          <div className="mt-2 border-t border-[#7CC7A1]/45 pt-2">
                            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#FF5A36]">
                              <TriangleAlert size={11} />
                              {text.allergens} · {allergens.length}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {allergens.map((code) => (
                                <span
                                  key={code}
                                  className="border border-[#7CC7A1]/60 bg-[#1A0D14]/65 px-2 py-0.5 text-[9px] font-bold"
                                >
                                  {allergenLabel(code, language)}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1 text-[9px] leading-3 text-[#FFF1D7]/55">
                              {text.allergenNotice}
                            </p>
                          </div>
                        )}
                        {recommendations.length > 0 && (
                          <div className="mt-2 border-t border-[#7CC7A1]/45 pt-2">
                            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#7CC7A1]">
                              {text.pairings}
                            </p>
                            <div className="mt-1 grid gap-1">
                              {recommendations.map((item) => {
                                const added = catalogAdded === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 bg-[#1A0D14]/70 p-1.5"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                                      {translatedField(
                                        item,
                                        "name",
                                        language,
                                        item.name,
                                      )}
                                    </span>
                                    <strong className="text-[10px] tabular-nums text-[#FF5A36]">
                                      {currency.format(item.price_cents / 100)}
                                    </strong>
                                    <button
                                      type="button"
                                      aria-label={`${text.add} ${item.name}`}
                                      onClick={() => addRecommendation(item.id)}
                                      className={`grid size-7 place-items-center bg-[#FF5A36] text-[#1A0D14] transition ${added ? "scale-110" : "active:scale-90"}`}
                                    >
                                      {added ? (
                                        <Check size={14} />
                                      ) : (
                                        <Plus size={13} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </details>
                    )}
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <strong className="border-b-2 border-[#FF5A36] pb-0.5 font-[var(--font-tokyo-serif)] text-[23px] font-bold tabular-nums text-[#FF5A36]">
                        {currency.format(product.price_cents / 100)}
                      </strong>
                      <span className="pb-1 font-[var(--font-tokyo-sans)] text-[8px] font-bold uppercase tracking-[.2em] text-[#7CC7A1]">
                        旬 · seasonal
                      </span>
                    </div>
                  </>
                ) : figmaTheme ? (
                  <>
                    <h2
                      className={`max-w-[21rem] text-[24px] leading-6 ${street ? "font-[var(--font-street-sans)] font-bold tracking-[2px] text-[#FFD600]" : "font-[var(--font-cozy-display)] font-normal tracking-[1.92px] text-[#FF3B30]"}`}
                    >
                      {translatedField(product, "name", language, product.name)}
                    </h2>
                    {(description ||
                      allergens.length > 0 ||
                      recommendations.length > 0) && (
                      <details
                        onToggle={(event) =>
                          toggleDetails(product.id, event.currentTarget)
                        }
                        className="group mt-2 text-white"
                      >
                        <summary
                          className={`flex cursor-pointer list-none items-center gap-1 text-[11px] font-bold uppercase tracking-[1px] ${street ? "font-[var(--font-street-condensed)]" : "font-[var(--font-cozy-display)]"}`}
                        >
                          {text.description}
                          <ChevronDown
                            size={12}
                            className="transition-transform group-open:rotate-180"
                          />
                        </summary>
                        {description && (
                          <p className="mt-1 text-[11px] leading-4 text-white/80">
                            {description}
                          </p>
                        )}
                        {allergens.length > 0 && (
                          <div className="mt-2 border-t border-white/25 pt-2">
                            <p className="flex items-center gap-1 text-[10px] font-bold uppercase">
                              <TriangleAlert size={11} />
                              {text.allergens} · {allergens.length}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {allergens.map((code) => (
                                <span
                                  key={code}
                                  className="rounded-full border border-white/35 bg-black/25 px-2 py-0.5 text-[9px] font-bold"
                                >
                                  {allergenLabel(code, language)}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1 text-[9px] leading-3 text-white/60">
                              {text.allergenNotice}
                            </p>
                          </div>
                        )}
                        {recommendations.length > 0 && (
                          <div className="mt-2 border-t border-white/25 pt-2">
                            <p className="text-[10px] font-bold uppercase">
                              {text.pairings}
                            </p>
                            <div className="mt-1 grid gap-1">
                              {recommendations.map((item) => {
                                const added = catalogAdded === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 bg-black/30 p-1.5"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                                      {translatedField(
                                        item,
                                        "name",
                                        language,
                                        item.name,
                                      )}
                                    </span>
                                    <strong
                                      className="text-[10px] tabular-nums"
                                      style={{
                                        color: street ? "#FFD600" : "#FF3B30",
                                      }}
                                    >
                                      {currency.format(item.price_cents / 100)}
                                    </strong>
                                    <button
                                      type="button"
                                      aria-label={`${text.add} ${item.name}`}
                                      onClick={() => addRecommendation(item.id)}
                                      className={`grid size-7 place-items-center rounded-full transition ${added ? "scale-110" : "active:scale-90"}`}
                                      style={{
                                        background: street
                                          ? "#FFD600"
                                          : "#FF3B30",
                                        color: "#111111",
                                      }}
                                    >
                                      {added ? (
                                        <Check size={14} />
                                      ) : (
                                        <Plus size={13} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </details>
                    )}
                    <div className="mt-3 flex min-h-11 items-center justify-between gap-4">
                      <strong
                        className={`px-4 py-2 text-[32px] leading-8 tabular-nums ${street ? "bg-[#FFD600] font-[var(--font-street-condensed)] font-extrabold text-[#111111]" : "rounded-lg bg-[#FF3B30] font-[var(--font-street-condensed)] font-extrabold text-white"}`}
                      >
                        {currency.format(product.price_cents / 100)}
                      </strong>
                      <button
                        aria-label={`${text.add} ${product.name}`}
                        title={text.add}
                        onClick={() => addProduct(product.id)}
                        className="shrink-0 transition active:scale-90"
                      >
                        <FigmaThemeAdd theme={figmaThemeKey} />
                      </button>
                    </div>
                  </>
                ) : noirLuxe ? (
                  <>
                    <div className="flex min-h-9 items-center justify-between gap-4">
                      <span
                        className={`bg-[#111111]/40 px-2 py-1 uppercase text-white ${NOIRLUXE_TOKENS.typography.badge}`}
                      >
                        {product.is_featured ? text.featured : categoryName}
                      </span>
                      <button
                        aria-label={`${text.add} ${product.name}`}
                        title={text.add}
                        onClick={() => addProduct(product.id)}
                        className="shrink-0 transition active:scale-90"
                      >
                        <NoirLuxeAddIcon />
                      </button>
                    </div>
                    <h2
                      style={{ color: colors.accent }}
                      className={`mt-3 max-w-[21rem] ${NOIRLUXE_TOKENS.typography.dishName}`}
                    >
                      {translatedField(product, "name", language, product.name)}
                    </h2>
                    {description && (
                      <p
                        className={`mt-1 max-w-[22rem] text-[#F0E9DB] ${NOIRLUXE_TOKENS.typography.body}`}
                      >
                        {description}
                      </p>
                    )}
                    {(allergens.length > 0 || recommendations.length > 0) && (
                      <details
                        onToggle={(event) =>
                          toggleDetails(product.id, event.currentTarget)
                        }
                        className="group mt-1"
                      >
                        <summary
                          className={`flex cursor-pointer list-none items-center gap-1 text-[#F0E9DB] ${NOIRLUXE_TOKENS.typography.label}`}
                        >
                          {allergens.length > 0
                            ? text.allergens
                            : text.pairings}
                          <ChevronDown
                            size={12}
                            className="transition-transform group-open:rotate-180"
                          />
                        </summary>
                        {allergens.length > 0 && (
                          <div className="mt-2 border-t border-[#C9A96E]/30 pt-2">
                            <div className="flex flex-wrap gap-1.5">
                              {allergens.map((code) => (
                                <span
                                  key={code}
                                  className={`border border-[#C9A96E] bg-[#111111]/40 px-2 py-1 text-white ${NOIRLUXE_TOKENS.typography.tag}`}
                                >
                                  {allergenLabel(code, language)}
                                </span>
                              ))}
                            </div>
                            <p
                              className={`mt-2 text-[#F0E9DB]/70 ${NOIRLUXE_TOKENS.typography.label}`}
                            >
                              {text.allergenNotice}
                            </p>
                          </div>
                        )}
                        {recommendations.length > 0 && (
                          <div className="mt-2 border-t border-[#C9A96E]/30 pt-2">
                            <p
                              className={`text-[#F0E9DB] ${NOIRLUXE_TOKENS.typography.label}`}
                            >
                              {text.pairings}
                            </p>
                            <div className="mt-1 grid gap-1">
                              {recommendations.map((item) => {
                                const added = catalogAdded === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 bg-black/35 p-1"
                                  >
                                    <span
                                      role="img"
                                      aria-label=""
                                      style={
                                        item.image_url
                                          ? {
                                              backgroundImage: `url(${item.image_url})`,
                                            }
                                          : undefined
                                      }
                                      className="h-8 w-8 shrink-0 bg-white/10 bg-cover bg-center"
                                    />
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-medium">
                                      {translatedField(
                                        item,
                                        "name",
                                        language,
                                        item.name,
                                      )}
                                    </span>
                                    <strong
                                      style={{ color: colors.accent }}
                                      className="text-[9px] tabular-nums"
                                    >
                                      {currency.format(item.price_cents / 100)}
                                    </strong>
                                    <button
                                      type="button"
                                      aria-label={`${text.add} ${item.name}`}
                                      onClick={() => addRecommendation(item.id)}
                                      className={`grid h-7 w-7 shrink-0 place-items-center bg-[#C9A96E] text-[#111111] transition ${added ? "scale-110" : "active:scale-90"}`}
                                    >
                                      {added ? (
                                        <Check size={14} />
                                      ) : (
                                        <Plus size={13} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </details>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <strong
                        style={{ color: colors.accent }}
                        className={`px-2 tabular-nums ${NOIRLUXE_TOKENS.typography.price}`}
                      >
                        {currency.format(product.price_cents / 100)}
                      </strong>
                      <NoirLuxeProgress
                        active={index}
                        total={products.length}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`flex min-h-8 gap-2 ${primaryTemplate ? "items-start" : "items-center"}`}
                    >
                      <h2
                        className={`min-w-0 flex-1 font-semibold leading-tight tracking-[-.015em] ${primaryTemplate ? "line-clamp-2 text-[clamp(1.3rem,6vw,1.6rem)]" : "line-clamp-1 text-[clamp(1.05rem,4.8vw,1.3rem)]"}`}
                      >
                        {product.is_featured && (
                          <span
                            style={{ color: colors.accent }}
                            className="mr-1 text-[9px] align-middle"
                          >
                            ★
                          </span>
                        )}
                        {translatedField(
                          product,
                          "name",
                          language,
                          product.name,
                        )}
                      </h2>
                      <strong
                        style={{ color: colors.accent }}
                        className="shrink-0 pt-0.5 text-[14px] font-semibold tabular-nums"
                      >
                        {currency.format(product.price_cents / 100)}
                      </strong>
                      <button
                        aria-label={`${text.add} ${product.name}`}
                        title={text.add}
                        onClick={() => addProduct(product.id)}
                        style={{
                          background: colors.accent,
                          color: colors.background,
                        }}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-lg transition active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {(description ||
                      allergens.length > 0 ||
                      recommendations.length > 0) && (
                      <details
                        onToggle={(event) =>
                          toggleDetails(product.id, event.currentTarget)
                        }
                        className="group mt-1"
                      >
                        <summary
                          className={`flex cursor-pointer list-none items-center gap-1 font-semibold text-white/75 ${primaryTemplate ? "text-[12px]" : "text-[9px]"}`}
                        >
                          {text.description}
                          <ChevronDown
                            size={primaryTemplate ? 14 : 11}
                            className="transition-transform group-open:rotate-180"
                          />
                        </summary>
                        {description && (
                          <p
                            className={`mt-1 leading-snug text-white/75 ${primaryTemplate ? "text-[12px]" : "text-[10px]"}`}
                          >
                            {description}
                          </p>
                        )}
                        {allergens.length > 0 && (
                          <div className="mt-1 border-t border-white/10 pt-1">
                            <p className="flex items-center gap-1 text-[9px] font-semibold text-white/65">
                              <TriangleAlert size={10} />
                              {text.allergens} · {allergens.length}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {allergens.map((code) => (
                                <span
                                  key={code}
                                  style={{
                                    borderColor: colors.frame,
                                    background: `${colors.panel}d9`,
                                  }}
                                  className="rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                                >
                                  {allergenLabel(code, language)}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1 text-[9px] leading-snug text-white/50">
                              {text.allergenNotice}
                            </p>
                          </div>
                        )}
                        {recommendations.length > 0 && (
                          <div className="mt-1.5 border-t border-white/10 pt-1.5">
                            <p className="text-[9px] font-semibold text-white/65">
                              {text.pairings}
                            </p>
                            <div className="mt-1 grid gap-1">
                              {recommendations.map((item) => {
                                const added = catalogAdded === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 rounded-lg bg-black/20 p-1"
                                  >
                                    <span
                                      role="img"
                                      aria-label=""
                                      style={
                                        item.image_url
                                          ? {
                                              backgroundImage: `url(${item.image_url})`,
                                            }
                                          : undefined
                                      }
                                      className="h-8 w-8 shrink-0 rounded-md bg-white/10 bg-cover bg-center"
                                    />
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                                      {translatedField(
                                        item,
                                        "name",
                                        language,
                                        item.name,
                                      )}
                                    </span>
                                    <strong
                                      style={{ color: colors.accent }}
                                      className="text-[9px] tabular-nums"
                                    >
                                      {currency.format(item.price_cents / 100)}
                                    </strong>
                                    <button
                                      type="button"
                                      aria-label={`${text.add} ${item.name}`}
                                      onClick={() => addRecommendation(item.id)}
                                      style={{
                                        background: colors.accent,
                                        color: colors.background,
                                      }}
                                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${added ? "scale-110" : "active:scale-90"}`}
                                    >
                                      {added ? (
                                        <Check size={14} />
                                      ) : (
                                        <Plus size={13} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </details>
                    )}
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {tokyoPulse ? (
        <>
          <TokyoPulseTicker
            items={categoryGroups.map((group) => group.name)}
            className="fixed left-1/2 top-[max(58px,calc(env(safe-area-inset-top)+44px))] z-40 w-full max-w-[430px] -translate-x-1/2 md:max-w-[402px]"
          />
          <nav
            ref={categoryNavRef}
            aria-label={text.categories}
            className="fixed left-1/2 top-[max(88px,calc(env(safe-area-inset-top)+74px))] z-40 flex w-[calc(100%-2rem)] max-w-[370px] -translate-x-1/2 touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <span
              aria-hidden="true"
              className="w-[calc((100%-1rem)/3)] shrink-0"
            />
            {categoryGroups.map((group) => {
              const selected = activeCategory === group.id;
              return (
                <button
                  ref={(element) => {
                    if (element)
                      categoryButtonRefs.current.set(group.id, element);
                    else categoryButtonRefs.current.delete(group.id);
                  }}
                  key={group.id}
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  onClick={() => openCategory(group.id)}
                  className={`w-[calc((100%-1rem)/3)] shrink-0 snap-center truncate border px-2 py-1.5 font-[var(--font-tokyo-sans)] text-[10px] font-bold uppercase tracking-[.1em] transition duration-300 ${selected ? "border-[#FF5A36] bg-[#FF5A36] text-[#1A0D14]" : "border-[#7CC7A1]/65 bg-[#1A0D14]/75 text-[#FFF1D7] opacity-55"}`}
                >
                  {group.name}
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className="w-[calc((100%-1rem)/3)] shrink-0"
            />
          </nav>
        </>
      ) : figmaTheme ? (
        <nav
          ref={categoryNavRef}
          aria-label={text.categories}
          className={`fixed left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[370px] -translate-x-1/2 touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${street ? "top-[max(76px,calc(env(safe-area-inset-top)+60px))]" : "top-[max(100px,calc(env(safe-area-inset-top)+64px))]"}`}
        >
          <span
            aria-hidden="true"
            className="w-[calc((100%-1rem)/3)] shrink-0"
          />
          {categoryGroups.map((group) => {
            const selected = activeCategory === group.id;
            return (
              <button
                ref={(element) => {
                  if (element)
                    categoryButtonRefs.current.set(group.id, element);
                  else categoryButtonRefs.current.delete(group.id);
                }}
                key={group.id}
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => openCategory(group.id)}
                style={
                  street
                    ? selected
                      ? {
                          background: "#FFD600",
                          color: "#111111",
                          borderColor: "#FFD600",
                        }
                      : {
                          background: "rgba(17,17,17,.4)",
                          color: "#F5F5F0",
                          borderColor: "#FFD600",
                        }
                    : selected
                      ? { background: "#FF3B30", color: "#FFD600" }
                      : { background: "rgba(255,59,48,.72)", color: "#FFFFFF" }
                }
                className={`w-[calc((100%-1rem)/3)] shrink-0 snap-center truncate border-2 px-2 py-[5px] text-[12px] uppercase transition-opacity duration-300 ${street ? "font-[var(--font-street-condensed)] font-bold leading-3 tracking-[1px]" : "rounded-full border-transparent font-[var(--font-cozy-display)] leading-none"} ${selected ? "opacity-100" : "opacity-60"}`}
              >
                {group.name}
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="w-[calc((100%-1rem)/3)] shrink-0"
          />
        </nav>
      ) : noirLuxe ? (
        <nav
          ref={categoryNavRef}
          aria-label={text.categories}
          className="fixed left-1/2 top-[max(76px,calc(env(safe-area-inset-top)+60px))] z-40 flex w-full max-w-[430px] -translate-x-1/2 touch-pan-x gap-7 overflow-x-auto overscroll-x-contain px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-[402px]"
        >
          {categoryGroups.map((group) => {
            const selected = activeCategory === group.id;
            return (
              <button
                ref={(element) => {
                  if (element)
                    categoryButtonRefs.current.set(group.id, element);
                  else categoryButtonRefs.current.delete(group.id);
                }}
                key={group.id}
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => openCategory(group.id)}
                className={`shrink-0 border-b pb-1 uppercase transition-colors ${NOIRLUXE_TOKENS.typography.category} ${selected ? "border-[#C9A96E] text-white" : "border-[#111111] text-[#F0E9DB]"}`}
              >
                {group.name}
              </button>
            );
          })}
        </nav>
      ) : (
        <nav
          ref={categoryNavRef}
          aria-label={text.categories}
          className="fixed left-1/2 top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)] z-40 flex w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-[370px]"
        >
          <span
            aria-hidden="true"
            className="w-[calc((100%-1rem)/3)] shrink-0"
          />
          {categoryGroups.map((group) => {
            const selected = activeCategory === group.id;
            return (
              <button
                ref={(element) => {
                  if (element)
                    categoryButtonRefs.current.set(group.id, element);
                  else categoryButtonRefs.current.delete(group.id);
                }}
                key={group.id}
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => openCategory(group.id)}
                style={
                  selected
                    ? {
                        background: colors.accent,
                        color: colors.background,
                        borderColor: colors.accent,
                      }
                    : {
                        background: `${colors.nav}ed`,
                        borderColor: colors.frame,
                      }
                }
                className={`w-[calc((100%-1rem)/3)] shrink-0 snap-center truncate rounded-full border px-2 py-1.5 text-[10px] font-bold shadow-lg backdrop-blur-xl transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-[.45]"}`}
              >
                {group.name}
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="w-[calc((100%-1rem)/3)] shrink-0"
          />
        </nav>
      )}

      {!menuRailTheme && (
        <nav
          ref={controlsRef}
          aria-label="Controles de la carta"
          style={{ background: `${colors.nav}ed`, borderColor: colors.frame }}
          className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 grid-cols-5 items-center rounded-xl border px-1 py-1 shadow-2xl backdrop-blur-xl md:max-w-[370px]"
        >
          <button
            aria-label={text.menu}
            title={text.menu}
            onClick={() => setPanel("menu")}
            className="grid min-h-9 place-items-center rounded-lg text-white/80"
          >
            <List size={19} />
          </button>
          <button
            aria-label={muted ? text.soundOn : text.soundOff}
            title={muted ? text.soundOn : text.soundOff}
            onClick={() => setMuted((value) => !value)}
            className="grid min-h-9 place-items-center rounded-lg text-white/80"
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button
            aria-label={`${text.cart}: ${cartQuantity}`}
            title={text.cart}
            onClick={() => setPanel("cart")}
            className="relative grid min-h-9 place-items-center rounded-lg text-white"
          >
            <ShoppingBag size={20} />
            {cartQuantity > 0 && (
              <span
                style={{ background: colors.accent, color: colors.background }}
                className="absolute right-[24%] top-0 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black"
              >
                {cartQuantity}
              </span>
            )}
          </button>
          <button
            aria-label={text.info}
            title={text.info}
            onClick={() => setPanel("info")}
            className="grid min-h-9 place-items-center rounded-lg text-white/80"
          >
            <Info size={19} />
          </button>
          <button
            aria-label={text.share}
            title={text.share}
            onClick={share}
            className="grid min-h-9 place-items-center rounded-lg text-white/80"
          >
            <Share2 size={19} />
          </button>
        </nav>
      )}
    </main>
  );
}
