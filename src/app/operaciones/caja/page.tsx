import {redirect} from "next/navigation";
import {activeRestaurant} from "@/lib/permissions";
import {canUseWaiter,memberHome} from "@/lib/member-roles";
import {loadPickupOrders} from "@/lib/pickup-orders-server";
import {PickupCashier} from "@/components/dashboard/pickup-cashier";
export default async function CashierPage(){const{restaurant,member}=await activeRestaurant();if(!canUseWaiter(member.role))redirect(memberHome(member.role));if(!restaurant.ordering_enabled||!["active","trialing"].includes(restaurant.subscription_status))return <main className="p-6">Menuly Comandas no está activo.</main>;return <PickupCashier initialOrders={await loadPickupOrders(restaurant.id)} currency={restaurant.currency}/>}
