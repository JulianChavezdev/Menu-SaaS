"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  activeRestaurant,
  canAddCategory,
  canAddProduct,
} from "@/lib/permissions";
import { isMenuTemplateKey, MENU_TEMPLATES } from "@/lib/menu-templates";
import { buildCheckoutParams, checkoutIsConfigured } from "@/lib/billing";
import { mergeTranslation } from "@/lib/translations";
import {
  automaticTranslationMap,
  translateFieldsToEnglish,
  translateTextsToEnglish,
} from "@/lib/automatic-translation";
import {
  isAutomaticPosterPath,
  isValidMediaPath,
  storagePathFromPublicUrl,
  type MediaKind,
} from "@/lib/media";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";
import { ALLERGEN_CODES } from "@/lib/allergens";
import { cookies } from "next/headers";
import {
  cloudinaryVideoPosterUrl,
  configuredCloudinary,
  destroyCloudinaryVideo,
  optimizedCloudinaryVideoUrl,
} from "@/lib/cloudinary";
const uuid = z.string().uuid();
const orderedIds = z
  .array(uuid)
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length);
const category = z.object({ name: z.string().min(2).max(60) });
const product = z.object({
  id: uuid.optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price_cents: z.coerce.number().int().min(0),
  category_id: uuid,
  allergens: z
    .array(z.enum(ALLERGEN_CODES))
    .max(14)
    .refine((items) => new Set(items).size === items.length),
  recommendations: z
    .array(uuid)
    .max(3)
    .refine((items) => new Set(items).size === items.length),
  is_available: z.boolean(),
  is_featured: z.boolean(),
});
const feedbackInput = z.object({
  category: z.enum(["improvement", "feature", "problem", "remove", "other"]),
  message: z
    .string()
    .trim()
    .min(10, "Escribe al menos 10 caracteres.")
    .max(2000, "El comentario es demasiado largo."),
});
function refresh(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/r/${slug}`);
}
export async function submitRestaurantFeedback(form: FormData) {
  const parsed = feedbackInput.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message ?? "Revisa el comentario.");
  const { supabase, restaurant, user } = await activeRestaurant();
  const { error } = await supabase
    .from("restaurant_feedback")
    .insert({ restaurant_id: restaurant.id, user_id: user.id, ...parsed.data });
  if (error) throw new Error("No se pudo enviar el comentario.");
  revalidatePath("/dashboard/billing");
}
export async function saveAnalyticsGoals(form: FormData) {
  const parsed = z
    .object({
      weekly_menu_views: z.coerce.number().int().min(1).max(1000000),
      weekly_cart_adds: z.coerce.number().int().min(1).max(100000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error("Revisa los objetivos semanales.");
  const { supabase, restaurant } = await activeRestaurant();
  const { error } = await supabase
    .from("restaurant_analytics_goals")
    .upsert(
      { restaurant_id: restaurant.id, ...parsed.data },
      { onConflict: "restaurant_id" },
    );
  if (error) throw new Error("No se pudieron guardar los objetivos.");
  revalidatePath("/dashboard/analytics");
}
export async function selectRestaurant(restaurantId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!z.string().uuid().safeParse(restaurantId).success)
    throw new Error("Restaurante no válido.");
  const { data } = await supabase
    .from("restaurant_members")
    .select("restaurant_id,restaurants(access_suspended)")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("No tienes acceso a este restaurante.");
  const selected = data.restaurants as unknown as {
    access_suspended?: boolean;
  } | null;
  if (selected?.access_suspended) redirect("/suspended");
  (await cookies()).set("active_restaurant_id", restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/dashboard");
}
export async function createRestaurant(form: FormData) {
  const { createClient } = await import("@/lib/supabase/server");
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) throw new Error("Tu sesión ha caducado. Inicia sesión de nuevo.");
  const { createClient: adminClient } = await import("@supabase/supabase-js");
  const key = getSupabaseSecretKey();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url)
    throw new Error("Falta la configuración segura del servidor.");
  const s = adminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const name = String(form.get("name") || "").trim();
  const slug = String(form.get("slug") || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (
    name.length < 2 ||
    name.length > 80 ||
    !slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  )
    throw new Error("Revisa el nombre y el slug.");
  const { data: created, error } = await s
    .from("restaurants")
    .insert({ name, slug, currency: "EUR", locale: "es-ES", owner_id: user.id })
    .select("id")
    .single();
  if (error)
    throw new Error(
      error.code === "23505" ? "Ese slug ya está en uso." : error.message,
    );
  try {
    const { error: memberError } = await s
      .from("restaurant_members")
      .insert({ restaurant_id: created.id, user_id: user.id, role: "owner" });
    if (memberError) throw memberError;
    const trialEnd = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { error: subscriptionError } = await s.from("subscriptions").insert({
      restaurant_id: created.id,
      provider: "stripe",
      plan: "carta",
      status: "trialing",
      current_period_end: trialEnd,
    });
    if (subscriptionError) throw subscriptionError;
    const { error: categoryError } = await s.from("categories").insert(
      ["Entrantes", "Principales", "Postres", "Bebidas"].map(
        (categoryName, sort_order) => ({
          restaurant_id: created.id,
          name: categoryName,
          slug: categoryName.toLowerCase(),
          sort_order,
        }),
      ),
    );
    if (categoryError) throw categoryError;
  } catch (setupError) {
    await s.from("restaurants").delete().eq("id", created.id);
    throw new Error(
      setupError instanceof Error
        ? setupError.message
        : "No se pudo preparar el restaurante.",
    );
  }
  revalidatePath("/dashboard");
}
export async function saveCategory(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const p = category.safeParse({ name: form.get("name") });
  if (!p.success) throw new Error("El nombre de categoría no es válido");
  const translated = await translateFieldsToEnglish({ name: p.data.name });
  const id = String(form.get("id") || "");
  const slug = p.data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
  if (id) {
    const { data: current } = await supabase
      .from("categories")
      .select("name,translations")
      .eq("id", id)
      .eq("restaurant_id", restaurant.id)
      .single();
    await supabase
      .from("categories")
      .update({
        name: p.data.name,
        slug,
        translations: automaticTranslationMap(
          current?.translations,
          translated,
          current?.name !== p.data.name,
        ),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurant.id)
      .throwOnError();
  } else {
    if (!(await canAddCategory(restaurant.id)))
      throw new Error("El plan de prueba permite hasta 5 categorías.");
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id);
    await supabase
      .from("categories")
      .insert({
        restaurant_id: restaurant.id,
        name: p.data.name,
        slug,
        translations: automaticTranslationMap(undefined, translated, true),
        sort_order: count ?? 0,
      })
      .throwOnError();
  }
  refresh(restaurant.slug);
  return { translationStatus: translated.status };
}
export async function deleteCategory(id: string) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new Error("Categoría no válida.");
  const { supabase, restaurant } = await activeRestaurant();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", parsed.data)
    .eq("restaurant_id", restaurant.id);
  if (count)
    throw new Error("Mueve o elimina primero los productos de esta categoría.");
  await supabase
    .from("categories")
    .delete()
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
}
export async function toggleCategory(id: string, is_active: boolean) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new Error("Categoría no válida.");
  const { supabase, restaurant } = await activeRestaurant();
  await supabase
    .from("categories")
    .update({ is_active: Boolean(is_active) })
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
}
export async function reorderCategories(ids: string[]) {
  const parsed = orderedIds.safeParse(ids);
  if (!parsed.success) throw new Error("Orden de categorías no válido.");
  const { supabase, restaurant } = await activeRestaurant();
  await Promise.all(
    parsed.data.map((id, sort_order) =>
      supabase
        .from("categories")
        .update({ sort_order })
        .eq("id", id)
        .eq("restaurant_id", restaurant.id)
        .throwOnError(),
    ),
  );
  refresh(restaurant.slug);
}
export async function saveProduct(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const p = product.safeParse({
    id: form.get("id") || undefined,
    name: form.get("name"),
    description: form.get("description") || undefined,
    price_cents: Math.round(Number(form.get("price")) * 100),
    category_id: form.get("category_id"),
    allergens: form.getAll("allergens"),
    recommendations: form.getAll("recommendations"),
    is_available: form.get("is_available") === "on",
    is_featured: form.get("is_featured") === "on",
  });
  if (!p.success) throw new Error("Revisa los datos del producto.");
  const { id, recommendations, ...values } = p.data;
  if (id && recommendations.includes(id))
    throw new Error("Un producto no puede recomendarse a sí mismo.");
  if (recommendations.length) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .in("id", recommendations);
    if (count !== recommendations.length)
      throw new Error("Una recomendación no pertenece a este restaurante.");
  }
  const translated = await translateFieldsToEnglish({
    name: values.name,
    description: values.description,
  });
  let productId = id;
  if (id) {
    const { data: current } = await supabase
      .from("products")
      .select("name,description,translations")
      .eq("id", id)
      .eq("restaurant_id", restaurant.id)
      .single();
    const changed =
      current?.name !== values.name ||
      (current?.description ?? "") !== (values.description ?? "");
    await supabase
      .from("products")
      .update({
        ...values,
        translations: automaticTranslationMap(
          current?.translations,
          translated,
          changed,
        ),
      })
      .eq("id", id)
      .eq("restaurant_id", restaurant.id)
      .throwOnError();
  } else {
    if (!(await canAddProduct(restaurant.id)))
      throw new Error("El plan de prueba permite hasta 3 productos.");
    const { data: created } = await supabase
      .from("products")
      .insert({
        ...values,
        translations: automaticTranslationMap(undefined, translated, true),
        restaurant_id: restaurant.id,
      })
      .select("id")
      .single()
      .throwOnError();
    productId = created.id;
  }
  await supabase
    .from("product_recommendations")
    .delete()
    .eq("restaurant_id", restaurant.id)
    .eq("source_product_id", productId!)
    .throwOnError();
  if (recommendations.length)
    await supabase
      .from("product_recommendations")
      .insert(
        recommendations.map((recommended_product_id, sort_order) => ({
          restaurant_id: restaurant.id,
          source_product_id: productId!,
          recommended_product_id,
          sort_order,
        })),
      )
      .throwOnError();
  refresh(restaurant.slug);
  revalidatePath("/dashboard/menu");
  return { translationStatus: translated.status };
}
export async function deleteProduct(id: string) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new Error("Producto no válido.");
  const { supabase, restaurant } = await activeRestaurant();
  const { data: product } = await supabase
    .from("products")
    .select("video_path,image_path")
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .single();
  await supabase
    .from("products")
    .delete()
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .throwOnError();
  if (product?.video_path?.startsWith("cloudinary:"))
    await destroyCloudinaryVideo(product.video_path);
  const paths = [
    product?.video_path?.startsWith("cloudinary:") ? null : product?.video_path,
    product?.image_path,
  ].filter((value): value is string => Boolean(value));
  if (paths.length)
    await supabase.storage.from("restaurant-media").remove(paths);
  refresh(restaurant.slug);
}
export async function toggleProduct(id: string, is_available: boolean) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new Error("Producto no válido.");
  const { supabase, restaurant } = await activeRestaurant();
  await supabase
    .from("products")
    .update({ is_available: Boolean(is_available) })
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
}
export async function reorderProducts(ids: string[]) {
  const parsed = orderedIds.safeParse(ids);
  if (!parsed.success) throw new Error("Orden de productos no válido.");
  const { supabase, restaurant } = await activeRestaurant();
  await Promise.all(
    parsed.data.map((id, sort_order) =>
      supabase
        .from("products")
        .update({ sort_order })
        .eq("id", id)
        .eq("restaurant_id", restaurant.id)
        .throwOnError(),
    ),
  );
  refresh(restaurant.slug);
}
export async function updateRestaurant(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const description = String(form.get("description") || "");
  const translated = await translateFieldsToEnglish({ description });
  const data = {
    name: String(form.get("name")),
    description,
    translations: automaticTranslationMap(
      restaurant.translations,
      translated,
      (restaurant.description ?? "") !== description,
    ),
    phone: String(form.get("phone") || ""),
    email: String(form.get("email") || ""),
    address: String(form.get("address") || ""),
    is_published: form.get("is_published") === "on",
  };
  await supabase
    .from("restaurants")
    .update(data)
    .eq("id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
  return { translationStatus: translated.status };
}
export async function translateEntireMenu() {
  const { supabase, restaurant } = await activeRestaurant();
  const [
    { data: categories, error: categoryError },
    { data: products, error: productError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,translations")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    supabase
      .from("products")
      .select("id,name,description,translations")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
  ]);
  if (categoryError || productError)
    throw new Error(categoryError?.message ?? productError?.message);
  const texts = [
    restaurant.description ?? "",
    ...(categories ?? []).map((item) => item.name),
    ...(products ?? []).flatMap((item) => [item.name, item.description ?? ""]),
  ];
  const translated = await translateTextsToEnglish(texts);
  if (translated.status !== "translated")
    return { translationStatus: translated.status, translatedCount: 0 };
  let index = 0;
  const restaurantDescription = translated.value[index++];
  const updates: PromiseLike<unknown>[] = [];
  if (restaurant.description)
    updates.push(
      supabase
        .from("restaurants")
        .update({
          translations: mergeTranslation(restaurant.translations, "en", {
            description: restaurantDescription,
          }),
        })
        .eq("id", restaurant.id)
        .throwOnError(),
    );
  for (const item of categories ?? []) {
    updates.push(
      supabase
        .from("categories")
        .update({
          translations: mergeTranslation(item.translations, "en", {
            name: translated.value[index++],
          }),
        })
        .eq("id", item.id)
        .eq("restaurant_id", restaurant.id)
        .throwOnError(),
    );
  }
  for (const item of products ?? []) {
    const name = translated.value[index++];
    const description = translated.value[index++];
    updates.push(
      supabase
        .from("products")
        .update({
          translations: mergeTranslation(item.translations, "en", {
            name,
            description,
          }),
        })
        .eq("id", item.id)
        .eq("restaurant_id", restaurant.id)
        .throwOnError(),
    );
  }
  await Promise.all(updates);
  refresh(restaurant.slug);
  return {
    translationStatus: "translated" as const,
    translatedCount:
      (categories?.length ?? 0) +
      (products?.length ?? 0) +
      (restaurant.description ? 1 : 0),
  };
}
export async function updateAppearancePreferences(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const menuTemplate = String(form.get("menu_template") || "");
  if (!isMenuTemplateKey(menuTemplate))
    throw new Error("La plantilla seleccionada no es válida.");
  if (
    MENU_TEMPLATES[menuTemplate].tier === "premium" &&
    restaurant.subscription_status !== "active"
  )
    throw new Error("Esta plantilla requiere una suscripción activa.");
  const languageSwitcher = form.get("language_switcher_enabled") === "on";
  await supabase
    .from("restaurants")
    .update({
      language_switcher_enabled: languageSwitcher,
      menu_template: menuTemplate,
    })
    .eq("id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
  return languageSwitcher
    ? await translateEntireMenu()
    : { translationStatus: "empty" as const, translatedCount: 0 };
}
export async function startCheckout() {
  const { restaurant, user, member } = await activeRestaurant();
  if (!["owner", "admin"].includes(String(member.role)))
    throw new Error("No tienes permisos para gestionar la suscripción.");
  if (restaurant.subscription_status === "active")
    redirect("/dashboard/billing");
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PLAN_PRICE_ID;
  if (!checkoutIsConfigured(secretKey, priceId))
    throw new Error("El pago todavía no está disponible.");
  const params = buildCheckoutParams({
    priceId: priceId!,
    restaurantId: restaurant.id,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    email: user.email,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.url)
    throw new Error(payload.error?.message ?? "No se pudo iniciar el pago.");
  const checkoutUrl = new URL(payload.url);
  if (checkoutUrl.protocol !== "https:")
    throw new Error("Stripe devolvió una URL no válida.");
  redirect(checkoutUrl.toString());
}
export async function updateRestaurantLinks(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const instagram_url = String(form.get("instagram_url") || "").trim();
  const website_url = String(form.get("website_url") || "").trim();
  for (const value of [instagram_url, website_url])
    if (value && !/^https?:\/\//i.test(value))
      throw new Error("Las URLs deben empezar por http:// o https://");
  await supabase
    .from("restaurants")
    .update({
      instagram_url: instagram_url || null,
      website_url: website_url || null,
    })
    .eq("id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
}
export async function updateLocalization(form: FormData) {
  const { supabase, restaurant } = await activeRestaurant();
  const currency = String(form.get("currency"));
  const locale = String(form.get("locale"));
  const timezone = String(form.get("timezone"));
  if (!["EUR", "USD", "GBP", "MXN"].includes(currency))
    throw new Error("Moneda no válida.");
  if (!["es-ES", "en-US", "en-GB", "es-MX"].includes(locale))
    throw new Error("Idioma no válido.");
  if (
    ![
      "Europe/Madrid",
      "America/Mexico_City",
      "America/New_York",
      "Europe/London",
    ].includes(timezone)
  )
    throw new Error("Zona horaria no válida.");
  await supabase
    .from("restaurants")
    .update({ currency, locale, timezone })
    .eq("id", restaurant.id)
    .throwOnError();
  refresh(restaurant.slug);
}
async function teamAdmin() {
  const context = await activeRestaurant();
  const role = String(context.member.role);
  if (role !== "owner" && role !== "admin")
    throw new Error("No tienes permisos para gestionar el equipo.");
  const { createClient } = await import("@supabase/supabase-js");
  const key = getSupabaseSecretKey();
  if (!key) throw new Error("Falta la configuración segura del servidor.");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { ...context, admin, role };
}
export async function inviteMember(form: FormData) {
  const { restaurant, admin } = await teamAdmin();
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const role = String(form.get("role") || "editor");
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new Error("Introduce un correo válido.");
  if (!["admin", "editor"].includes(role)) throw new Error("Rol no válido.");
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw new Error(listError.message);
  let user = list.users.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
    });
    if (error) throw new Error(error.message);
    user = data.user;
  }
  if (!user) throw new Error("No se pudo crear la invitación.");
  const { error } = await admin
    .from("restaurant_members")
    .upsert(
      { restaurant_id: restaurant.id, user_id: user.id, role },
      { onConflict: "restaurant_id,user_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
}
export async function changeMemberRole(
  memberId: string,
  role: "admin" | "editor",
) {
  const parsed = uuid.safeParse(memberId);
  if (!parsed.success || !["admin", "editor"].includes(role))
    throw new Error("Miembro o rol no válido.");
  const { restaurant, admin } = await teamAdmin();
  const { data: target, error: readError } = await admin
    .from("restaurant_members")
    .select("role")
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .single();
  if (readError) throw new Error(readError.message);
  if (target.role === "owner")
    throw new Error("No se puede cambiar el rol del propietario.");
  const { error } = await admin
    .from("restaurant_members")
    .update({ role })
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
}
export async function removeMember(memberId: string) {
  const parsed = uuid.safeParse(memberId);
  if (!parsed.success) throw new Error("Miembro no válido.");
  const { restaurant, admin } = await teamAdmin();
  const { data: target, error: readError } = await admin
    .from("restaurant_members")
    .select("role")
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .single();
  if (readError) throw new Error(readError.message);
  if (target.role === "owner")
    throw new Error("No se puede eliminar al propietario.");
  const { error } = await admin
    .from("restaurant_members")
    .delete()
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
}
export async function assignMedia(
  kind: MediaKind,
  path: string,
  productId?: string,
  posterPath?: string,
) {
  const { supabase, restaurant } = await activeRestaurant();
  if (!isValidMediaPath({ kind, path, restaurantId: restaurant.id, productId }))
    throw new Error("Ruta de archivo no válida.");
  const url = supabase.storage.from("restaurant-media").getPublicUrl(path)
    .data.publicUrl;
  if (kind === "product-video") {
    if (
      posterPath &&
      (!isAutomaticPosterPath(posterPath) ||
        !isValidMediaPath({
          kind: "product-image",
          path: posterPath,
          restaurantId: restaurant.id,
          productId,
        }))
    )
      throw new Error("Miniatura no válida.");
    const { data: previous } = await supabase
      .from("products")
      .select("video_path,image_path")
      .eq("id", productId!)
      .eq("restaurant_id", restaurant.id)
      .single();
    const usePoster =
      Boolean(posterPath) &&
      (!previous?.image_path || isAutomaticPosterPath(previous.image_path));
    const posterUrl = usePoster
      ? supabase.storage.from("restaurant-media").getPublicUrl(posterPath!).data
          .publicUrl
      : null;
    await supabase
      .from("products")
      .update({
        video_path: path,
        video_url: url,
        ...(usePoster ? { image_path: posterPath, image_url: posterUrl } : {}),
      })
      .eq("id", productId!)
      .eq("restaurant_id", restaurant.id)
      .throwOnError();
    if (previous?.video_path?.startsWith("cloudinary:"))
      await destroyCloudinaryVideo(previous.video_path);
    else if (previous?.video_path && previous.video_path !== path)
      await supabase.storage
        .from("restaurant-media")
        .remove([previous.video_path]);
    if (
      usePoster &&
      isAutomaticPosterPath(previous?.image_path) &&
      previous?.image_path !== posterPath
    )
      await supabase.storage
        .from("restaurant-media")
        .remove([previous!.image_path!]);
    if (posterPath && !usePoster)
      await supabase.storage.from("restaurant-media").remove([posterPath]);
  } else if (kind === "product-image") {
    const { data: previous } = await supabase
      .from("products")
      .select("image_path")
      .eq("id", productId!)
      .eq("restaurant_id", restaurant.id)
      .single();
    await supabase
      .from("products")
      .update({ image_path: path, image_url: url })
      .eq("id", productId!)
      .eq("restaurant_id", restaurant.id)
      .throwOnError();
    if (previous?.image_path && previous.image_path !== path)
      await supabase.storage
        .from("restaurant-media")
        .remove([previous.image_path]);
  } else {
    const previousPath = storagePathFromPublicUrl(
      restaurant.logo_url,
      "restaurant-media",
    );
    await supabase
      .from("restaurants")
      .update({ logo_url: url })
      .eq("id", restaurant.id)
      .throwOnError();
    if (previousPath && previousPath !== path)
      await supabase.storage.from("restaurant-media").remove([previousPath]);
  }
  refresh(restaurant.slug);
}
export async function assignCloudinaryVideo(
  productId: string,
  publicId: string,
) {
  const parsed = uuid.safeParse(productId);
  if (!parsed.success) throw new Error("Producto no válido.");
  const { restaurant, supabase } = await activeRestaurant();
  const prefix = `carta-video/${restaurant.id}/products/${parsed.data}/`;
  if (
    !publicId.startsWith(prefix) ||
    !publicId.slice(prefix.length).match(/^[0-9a-f-]{36}$/i)
  )
    throw new Error("Vídeo externo no válido.");
  const config = configuredCloudinary();
  if (!config) throw new Error("Cloudinary no está configurado.");
  await config.client.api.resource(publicId, { resource_type: "video" });
  const { data: previous, error: readError } = await supabase
    .from("products")
    .select("video_path,image_path")
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .single();
  if (readError) throw new Error("Producto no encontrado.");
  const replacePoster =
    !previous.image_path || isAutomaticPosterPath(previous.image_path);
  const media = {
    video_path: `cloudinary:${publicId}`,
    video_url: optimizedCloudinaryVideoUrl(publicId),
    ...(replacePoster
      ? { image_path: null, image_url: cloudinaryVideoPosterUrl(publicId) }
      : {}),
  };
  await supabase
    .from("products")
    .update(media)
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id)
    .throwOnError();
  if (previous.video_path?.startsWith("cloudinary:"))
    await destroyCloudinaryVideo(previous.video_path);
  else if (previous.video_path)
    await supabase.storage
      .from("restaurant-media")
      .remove([previous.video_path]);
  if (replacePoster && isAutomaticPosterPath(previous.image_path))
    await supabase.storage
      .from("restaurant-media")
      .remove([previous.image_path!]);
  refresh(restaurant.slug);
}
