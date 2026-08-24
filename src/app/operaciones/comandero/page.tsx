import { redirect } from "next/navigation";
import { WaiterPos } from "@/components/dashboard/waiter-pos";
import { OperationalUnavailable } from "@/components/dashboard/operational-unavailable";
import { canUseWaiter, memberHome } from "@/lib/member-roles";
import { activeRestaurant } from "@/lib/permissions";

export default async function WaiterPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const { supabase, restaurant, member } = await activeRestaurant();
  if (!canUseWaiter(member.role)) redirect(memberHome(member.role));
  if (!restaurant.ordering_enabled || !["active", "trialing"].includes(restaurant.subscription_status)) return <OperationalUnavailable />;

  const [{ data: tables }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("restaurant_tables").select("id,name,is_active,sort_order").eq("restaurant_id", restaurant.id).eq("is_active", true).order("sort_order").order("name"),
    supabase.from("categories").select("id,name,sort_order").eq("restaurant_id", restaurant.id).eq("is_active", true).order("sort_order").order("name"),
    supabase.from("products").select("id,category_id,name,price_cents,image_url,is_available,sort_order").eq("restaurant_id", restaurant.id).eq("is_available", true).order("sort_order").order("name"),
  ]);

  return <main className="min-h-screen bg-[#f4f1eb]"><WaiterPos restaurantName={restaurant.name} currency={restaurant.currency} tables={tables ?? []} categories={categories ?? []} products={products ?? []} initialTableId={(await searchParams).table} isManager={!["waiter", "kitchen"].includes(member.role)} /></main>;
}
