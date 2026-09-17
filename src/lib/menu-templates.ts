export type TemplateTier = "free" | "premium";
export type TemplateLayout = "fullscreen" | "framed" | "editorial";
export type TemplateMotif =
  | "cinema"
  | "constellation"
  | "mediterranean"
  | "sakura"
  | "sol"
  | "deco"
  | "neon"
  | "noirluxe"
  | "street"
  | "cozy-corner"
  | "tokyo-pulse"
  | "social-hud";

type MenuTemplate = {
  key: string;
  name: string;
  description: string;
  previewLabel: string;
  tier: TemplateTier;
  layout: TemplateLayout;
  motif: TemplateMotif;
  colors: {
    background: string;
    panel: string;
    nav: string;
    accent: string;
    accent2: string;
    frame: string;
  };
};

const cinematicTemplate: MenuTemplate & { key: "cinematic" } = {
  key: "cinematic",
  name: "Cinemática",
  description:
    "Vídeo limpio a pantalla completa con el HUD flotante como único elemento visual.",
  previewLabel: "Vídeo inmersivo",
  tier: "free",
  layout: "fullscreen",
  motif: "cinema",
  colors: {
    background: "#0b0b0a",
    panel: "#171715",
    nav: "#171715",
    accent: "#fcd34d",
    accent2: "#fb7185",
    frame: "rgba(255,255,255,.14)",
  },
};
const noirLuxeTemplate: MenuTemplate & { key: "noirluxe" } = {
  key: "noirluxe",
  name: "NoirLuxe",
  description:
    "Fotografía protagonista, negro profundo y tipografía editorial dorada para una carta gastronómica sofisticada.",
  previewLabel: "Alta cocina",
  tier: "premium",
  layout: "fullscreen",
  motif: "noirluxe",
  colors: {
    background: "#111111",
    panel: "#111111",
    nav: "#111111",
    accent: "#C9A96E",
    accent2: "#F0E9DB",
    frame: "rgba(201,169,110,.33)",
  },
};
const streetTemplate: MenuTemplate & { key: "street" } = {
  key: "street",
  name: "Street",
  description:
    "Estética urbana de alto contraste, amarillo intenso y tipografía contundente para conceptos informales.",
  previewLabel: "Street food",
  tier: "premium",
  layout: "fullscreen",
  motif: "street",
  colors: {
    background: "#111111",
    panel: "#111111",
    nav: "#111111",
    accent: "#FFD600",
    accent2: "#F5F5F0",
    frame: "#FFD600",
  },
};
const cozyCornerTemplate: MenuTemplate & { key: "cozy-corner" } = {
  key: "cozy-corner",
  name: "Cozy Corner",
  description:
    "Una carta cálida, cercana y desenfadada con rojo coral, amarillo y formas suaves.",
  previewLabel: "Retro diner",
  tier: "premium",
  layout: "fullscreen",
  motif: "cozy-corner",
  colors: {
    background: "#FFFFFF",
    panel: "#FF3B30",
    nav: "#FF3B30",
    accent: "#FF3B30",
    accent2: "#FFD600",
    frame: "#FF3B30",
  },
};
const tokyoPulseTemplate: MenuTemplate & { key: "tokyo-pulse" } = {
  key: "tokyo-pulse",
  name: "Tokyo Pulse",
  description:
    "Ritmo de izakaya contemporánea, banner animado y contraste editorial para cocina asiática.",
  previewLabel: "Cocina asiática",
  tier: "premium",
  layout: "fullscreen",
  motif: "tokyo-pulse",
  colors: {
    background: "#1A0D14",
    panel: "#1A0D14",
    nav: "#1A0D14",
    accent: "#FF5A36",
    accent2: "#FFF1D7",
    frame: "#7CC7A1",
  },
};
const socialHudTemplate: MenuTemplate & { key: "social-hud" } = {
  key: "social-hud",
  name: "Social HUD",
  description:
    "Interfaz ultraligera inspirada en los feeds verticales: vídeo dominante, acciones laterales y navegación inmediata.",
  previewLabel: "Estilo social",
  tier: "premium",
  layout: "fullscreen",
  motif: "social-hud",
  colors: {
    background: "#08080A",
    panel: "#151519",
    nav: "#111114",
    accent: "#FE2C55",
    accent2: "#25F4EE",
    frame: "rgba(255,255,255,.24)",
  },
};

export const MENU_TEMPLATES = {
  cinematic: cinematicTemplate,
  noirluxe: noirLuxeTemplate,
  street: streetTemplate,
  "cozy-corner": cozyCornerTemplate,
  "tokyo-pulse": tokyoPulseTemplate,
  "social-hud": socialHudTemplate,
} as const;

export type MenuTemplateKey = keyof typeof MENU_TEMPLATES;
export const DEFAULT_MENU_TEMPLATE: MenuTemplateKey = "cinematic";

export function isMenuTemplateKey(value: string): value is MenuTemplateKey {
  return value in MENU_TEMPLATES;
}
export function resolveMenuTemplate(
  value: string | undefined | null,
  allowPremium = true,
) {
  const selected =
    MENU_TEMPLATES[
      isMenuTemplateKey(value ?? "")
        ? (value as MenuTemplateKey)
        : DEFAULT_MENU_TEMPLATE
    ];
  return selected.tier === "premium" && !allowPremium
    ? MENU_TEMPLATES[DEFAULT_MENU_TEMPLATE]
    : selected;
}
