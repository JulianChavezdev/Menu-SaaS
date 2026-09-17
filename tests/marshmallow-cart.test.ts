import { describe, it, expect } from "vitest";
import { marshmallowCartDetails } from "../src/lib/marshmallow-cart";
import { marshmallowProducts } from "../src/lib/marshmallow-demo";
import { customizationSchema } from "../src/lib/product-customization";

const fruit = marshmallowProducts[3];
const [fruits, extras] = fruit.customization!.groups;
const selection = [
  {
    groupId: fruits.id,
    optionIds: fruits.options.slice(0, 8).map((o) => o.id),
  },
  { groupId: extras.id, optionIds: [extras.options[0].id] },
];
describe("Marshmallow cart", () => {
  it("prices the selected extras and preserves the full customization", () => {
    expect(customizationSchema.safeParse(fruit.customization).success).toBe(
      true,
    );
    const [line] = marshmallowCartDetails(
      [{ productId: fruit.id, quantity: 2, note: "Sin hielo", selection }],
      marshmallowProducts,
    );
    expect(line.invalid).toBe("");
    expect(line.unitPrice).toBe(640);
    expect(line.options).toHaveLength(9);
    expect(line.note).toBe("Sin hielo");
    expect(line.unitPrice * line.quantity).toBe(1280);
  });
  it("blocks incomplete or excessive fruit selections", () => {
    for (const count of [0, 7, 9, 10]) {
      const [line] = marshmallowCartDetails(
        [
          {
            productId: fruit.id,
            quantity: 1,
            note: "",
            selection: [
              {
                groupId: fruits.id,
                optionIds: fruits.options.slice(0, count).map((o) => o.id),
              },
            ],
          },
        ],
        marshmallowProducts,
      );
      expect(line.invalid).toContain("elige 8");
    }
  });
  it("blocks removed and unavailable items rather than dropping them silently", () => {
    for (const products of [[], [{ ...fruit, is_available: false }]]) {
      const [line] = marshmallowCartDetails(
        [{ productId: fruit.id, quantity: 1, note: "", selection }],
        products,
      );
      expect(line.invalid).toContain("no está disponible");
      expect(line.unitPrice).toBe(0);
    }
  });
  it("rejects saved selections when an option becomes unavailable", () => {
    const updated = structuredClone(fruit);
    updated.customization!.groups[0].options[0].available = false;
    expect(
      marshmallowCartDetails(
        [{ productId: fruit.id, quantity: 1, note: "", selection }],
        [updated],
      )[0].invalid,
    ).toContain("ya no está disponible");
  });
  it("keeps regular items simple and limits quantities", () => {
    const regular = marshmallowProducts[0];
    const [valid, excess] = marshmallowCartDetails(
      [
        { productId: regular.id, quantity: 1, note: "" },
        { productId: regular.id, quantity: 21, note: "" },
      ],
      marshmallowProducts,
    );
    expect(valid.unitPrice).toBe(350);
    expect(valid.invalid).toBe("");
    expect(valid.options).toEqual([]);
    expect(excess.invalid).toContain("20 unidades");
  });
});
