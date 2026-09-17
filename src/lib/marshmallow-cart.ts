import { cartLineKey, type CartLine } from "./menu-cart";
import { resolveCustomization } from "./product-customization";
import type { Product } from "./types";

export function marshmallowCartDetails(lines: CartLine[], products: Product[]) {
  return lines.map((line) => {
    const product = products.find((item) => item.id === line.productId);
    const base = { ...line, lineKey: cartLineKey(line), product };
    if (!product || !product.is_available)
      return {
        ...base,
        unitPrice: 0,
        options: [],
        invalid: "Este producto ya no está disponible. Retíralo del pedido.",
      };
    try {
      const resolved = resolveCustomization(
        product.customization,
        line.selection,
      );
      return {
        ...base,
        unitPrice: product.price_cents + resolved.extraCents,
        options: resolved.options,
        invalid:
          line.quantity > 20 ? "El máximo es de 20 unidades por producto." : "",
      };
    } catch (error) {
      return {
        ...base,
        unitPrice: product.price_cents,
        options: [],
        invalid:
          error instanceof Error ? error.message : "Revisa este producto",
      };
    }
  });
}
