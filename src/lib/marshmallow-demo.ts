import { demoRestaurant } from "./demo";
import type { Product, Restaurant } from "./types";
import type { AllergenCode } from "./allergens";

export const marshmallowRestaurant: Restaurant = {
  ...demoRestaurant,
  id: "demo-marshmallow",
  name: "nube heladería",
  menu_template: "marshmallow",
  description:
    "Una heladería de ejemplo para descubrir la plantilla Marshmallow. Los productos y precios son de demostración.",
  translations: {
    en: {
      description:
        "An example ice cream shop showcasing Marshmallow. Products and prices are for demonstration.",
    },
  },
  phone: null,
  address: null,
  email: null,
  primary_color: "#99435B",
  secondary_color: "#DAE6C5",
};
const uuid = (n: number) =>
  `b1182026-0917-4000-8000-${String(n).padStart(12, "0")}`;
const categories = [
  { name: "Helados", en: "Ice cream" },
  { name: "Copas y fruta", en: "Sundaes & fruit" },
  { name: "Otros antojos", en: "More treats" },
];
const treats = [
  {
    name: "Fresa de verano",
    en: "Summer strawberry",
    description: "Suave, afrutado y con ese rosa que alegra el día.",
    descriptionEn: "Soft, fruity and a little pink to brighten your day.",
    price: 350,
    asset: "strawberry",
    category: 0,
    allergens: ["milk", "gluten"],
  },
  {
    name: "Pistacho cremoso",
    en: "Creamy pistachio",
    description: "Un sabor delicado con pequeños trocitos de pistacho.",
    descriptionEn: "A delicate flavour with little pieces of pistachio.",
    price: 390,
    asset: "pistachio",
    category: 0,
    allergens: ["milk", "gluten", "nuts"],
  },
  {
    name: "La copa nube",
    en: "The cloud sundae",
    description: "Tres sabores, una cereza y muchas ganas de repetir.",
    descriptionEn: "Three flavours, a cherry and every reason for another.",
    price: 650,
    asset: "sundae",
    category: 1,
    allergens: ["milk", "gluten", "nuts"],
  },
  {
    name: "Frutas a tu gusto",
    en: "Fruit your way",
    description: "Elige tus ocho frutas favoritas y añade el toque final.",
    descriptionEn: "Choose your eight favourite fruits and a finishing touch.",
    price: 590,
    asset: "fruit-bowl",
    category: 1,
    allergens: [],
  },
  {
    name: "Gofre con helado",
    en: "Waffle & ice cream",
    description: "Gofre dorado, vainilla y un hilo de chocolate.",
    descriptionEn: "Golden waffle, vanilla and a drizzle of chocolate.",
    price: 690,
    asset: "waffle",
    category: 2,
    allergens: ["gluten", "milk", "eggs"],
  },
  {
    name: "Batido de vainilla",
    en: "Vanilla shake",
    description: "Cremoso hasta la última gota, con una nube de nata.",
    descriptionEn: "Creamy to the last drop, with a cloud of whipped cream.",
    price: 490,
    asset: "shake",
    category: 2,
    allergens: ["milk"],
  },
];
export const marshmallowProducts: Product[] = treats.map((treat, index) => ({
  id: uuid(index + 1),
  name: treat.name,
  description: treat.description,
  translations: { en: { name: treat.en, description: treat.descriptionEn } },
  price_cents: treat.price,
  image_url: `/templates/marshmallow/${treat.asset}.svg`,
  video_url: null,
  category_id: uuid(10 + treat.category),
  categories: {
    name: categories[treat.category].name,
    translations: { en: { name: categories[treat.category].en } },
  },
  sort_order: index,
  is_available: true,
  is_featured: index === 0,
  allergens: treat.allergens as AllergenCode[],
  recommended_product_ids: index === 0 ? [uuid(6)] : [],
  customization:
    index === 3
      ? {
          enabled: true,
          groups: [
            {
              id: uuid(100),
              name: "Tus frutas · elige 8",
              min: 8,
              max: 8,
              options: [
                "Fresa",
                "Plátano",
                "Kiwi",
                "Mango",
                "Piña",
                "Melón",
                "Sandía",
                "Uva",
                "Manzana",
                "Arándanos",
              ].map((name, i) => ({
                id: uuid(101 + i),
                name,
                imageUrl: null,
                priceCents: 0,
                available: true,
              })),
            },
            {
              id: uuid(200),
              name: "El toque final",
              min: 0,
              max: 2,
              options: [
                {
                  id: uuid(201),
                  name: "Chocolate",
                  imageUrl: null,
                  priceCents: 50,
                  available: true,
                },
                {
                  id: uuid(202),
                  name: "Leche condensada",
                  imageUrl: null,
                  priceCents: 70,
                  available: true,
                },
                {
                  id: uuid(203),
                  name: "Granola",
                  imageUrl: null,
                  priceCents: 80,
                  available: true,
                },
              ],
            },
          ],
        }
      : null,
}));
