import {NextResponse} from "next/server";
import {activeRestaurant} from "@/lib/permissions";
import {canUseWaiter} from "@/lib/member-roles";
import {loadPickupOrders} from "@/lib/pickup-orders-server";
export async function GET(){const{restaurant,member}=await activeRestaurant();if(!canUseWaiter(member.role)||!restaurant.ordering_enabled||!["active","trialing"].includes(restaurant.subscription_status))return NextResponse.json({error:"Sin acceso a caja"},{status:403});try{return NextResponse.json({orders:await loadPickupOrders(restaurant.id)},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"No se pudieron actualizar pedidos"},{status:503})}}
