import { redirect } from "next/navigation";
import { KitchenBoard } from "@/components/dashboard/kitchen-board";
import { OperationalUnavailable } from "@/components/dashboard/operational-unavailable";
import { canUseKitchen, memberHome } from "@/lib/member-roles";
import { activeRestaurant } from "@/lib/permissions";
import { loadKitchenOrders } from "@/lib/kitchen-orders-server";

export default async function KitchenPage() {
  const { restaurant, member } = await activeRestaurant();
  if (!canUseKitchen(member.role)) redirect(memberHome(member.role));
  if (!restaurant.ordering_enabled || !["active", "trialing"].includes(restaurant.subscription_status)) return <OperationalUnavailable />;
  const orders = await loadKitchenOrders(restaurant.id);
  return <main className="min-h-screen bg-[#f4f1eb]"><KitchenBoard restaurantId={restaurant.id} currency={restaurant.currency} initialOrders={orders} isManager={!["waiter", "kitchen"].includes(member.role)} /></main>;
}
