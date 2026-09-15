import Link from "next/link";
import {activeRestaurant} from "@/lib/permissions";
import {PickupSettings} from "@/components/dashboard/pickup-settings";
export default async function PickupPage(){const{restaurant}=await activeRestaurant();return <main className="workspace-page"><header className="workspace-heading"><div><h1>Pedidos para recoger</h1><p className="workspace-description">Desde el QR a cocina. El cliente paga al recoger en caja.</p></div><Link className="workspace-button" href="/operaciones/caja">Abrir caja</Link></header>{restaurant.ordering_enabled?<PickupSettings enabled={!!restaurant.pickup_enabled} paused={!!restaurant.pickup_paused} slug={restaurant.slug}/>:<p>Activa Menuly Comandas para recibir pedidos del QR.</p>}</main>}
