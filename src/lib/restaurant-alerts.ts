export type RestaurantAlert = {
  id: string;
  tone: "critical" | "warning" | "opportunity";
  title: string;
  description: string;
  href: string;
  action: string;
};
export type RestaurantAlertInput = {
  subscriptionStatus: string;
  published: boolean;
  products: number;
  productsWithoutMedia: number;
  menuViews: number;
  cartAdds: number;
  recommendationAdds: number;
  hasLogo: boolean;
  hasContact: boolean;
};

export function restaurantAlerts(input: RestaurantAlertInput) {
  const alerts: RestaurantAlert[] = [];
  if (["past_due", "canceled"].includes(input.subscriptionStatus))
    alerts.push({
      id: "payment",
      tone: "critical",
      title: "La carta puede quedar suspendida",
      description: "Registra o revisa el pago para mantenerla publicada.",
      href: "/dashboard/billing",
      action: "Revisar suscripción",
    });
  if (!input.published)
    alerts.push({
      id: "publish",
      tone: "warning",
      title: "La carta no está publicada",
      description: "Los clientes todavía no pueden abrirla desde el QR.",
      href: "/dashboard/restaurant",
      action: "Publicar carta",
    });
  if (input.products === 0)
    alerts.push({
      id: "products",
      tone: "warning",
      title: "Añade tu primer producto",
      description: "La carta necesita al menos un plato para poder vender.",
      href: "/dashboard/menu",
      action: "Añadir producto",
    });
  else if (input.productsWithoutMedia > 0)
    alerts.push({
      id: "media",
      tone: "opportunity",
      title: `${input.productsWithoutMedia} producto${input.productsWithoutMedia === 1 ? "" : "s"} sin imagen ni vídeo`,
      description: "El contenido visual ayuda al cliente a decidir más rápido.",
      href: "/dashboard/menu",
      action: "Completar productos",
    });
  if (input.published && input.products > 0 && input.menuViews === 0)
    alerts.push({
      id: "traffic",
      tone: "opportunity",
      title: "No hubo visitas en los últimos 7 días",
      description: "Coloca el QR en mesas, escaparate y redes sociales.",
      href: "/dashboard/qr",
      action: "Abrir código QR",
    });
  if (input.menuViews >= 10 && input.cartAdds === 0)
    alerts.push({
      id: "conversion",
      tone: "opportunity",
      title: "Hay visitas, pero ningún añadido",
      description:
        "Revisa precios, portadas y descripciones de los productos más vistos.",
      href: "/dashboard/analytics?days=7",
      action: "Ver oportunidades",
    });
  if (
    input.products >= 2 &&
    input.cartAdds > 0 &&
    input.recommendationAdds === 0
  )
    alerts.push({
      id: "upsell",
      tone: "opportunity",
      title: "Activa la venta adicional",
      description:
        "Recomienda bebidas, acompañamientos o postres en tus productos más vendidos.",
      href: "/dashboard/menu",
      action: "Añadir recomendaciones",
    });
  if (!input.hasLogo || !input.hasContact)
    alerts.push({
      id: "identity",
      tone: "opportunity",
      title: "Completa la identidad del restaurante",
      description: `Falta ${!input.hasLogo && !input.hasContact ? "el logo y los datos de contacto" : !input.hasLogo ? "el logo" : "un teléfono o dirección"}.`,
      href: "/dashboard/restaurant",
      action: "Completar perfil",
    });
  const priority = { critical: 0, warning: 1, opportunity: 2 };
  return alerts.sort((a, b) => priority[a.tone] - priority[b.tone]).slice(0, 6);
}
