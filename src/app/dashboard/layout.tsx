import Link from "next/link";
import type {Metadata} from "next";
import {activeRestaurant} from "@/lib/permissions";
import {RestaurantSwitcher} from "@/components/dashboard/restaurant-switcher";
import {SignOut} from "@/components/dashboard/sign-out";
import {DashboardNavigation} from "@/components/dashboard/dashboard-navigation";
import {isSuperadminUser} from "@/lib/superadmin";

export const metadata:Metadata={title:"Panel",robots:{index:false,follow:false}};
const links=[['Inicio','/dashboard'],['Carta','/dashboard/menu'],['Apariencia','/dashboard/appearance'],['Analíticas','/dashboard/analytics'],['Restaurante','/dashboard/restaurant'],['Equipo','/dashboard/members'],['Código QR','/dashboard/qr'],['Suscripción','/dashboard/billing']] as const;

export default async function DashboardLayout({children}:{children:React.ReactNode}){
  const {supabase,user,restaurant}=await activeRestaurant();
  const {data:members}=await supabase.from("restaurant_members").select("restaurant_id,restaurants(id,name)").eq("user_id",user.id);
  const items=(members??[]).map(member=>member.restaurants as unknown as {id:string;name:string});
  const navigation=isSuperadminUser(user)?[...links,["Superadmin","/superadmin"] as const]:links;
  return <div className="dashboard-light min-h-screen bg-[#f4f1eb] text-slate-950 md:grid md:grid-cols-[240px_1fr]">
    <aside className="border-b border-stone-200 bg-white p-4 shadow-sm md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-3 md:block"><Link href="/dashboard" prefetch className="inline-flex items-center gap-2 text-lg font-black tracking-tight"><span className="h-5 w-2 bg-orange-600"/>Menuly</Link><div className="md:mt-5"><RestaurantSwitcher activeId={restaurant.id} items={items}/></div></div>
      <DashboardNavigation links={navigation}/>
      <div className="mt-8 border-t border-stone-200 pt-4 md:mt-auto"><SignOut/></div>
    </aside>
    <div className="min-w-0">{children}</div>
  </div>;
}
