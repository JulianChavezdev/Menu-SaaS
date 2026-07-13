import {redirect} from "next/navigation";
import {Ban} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {SignOut} from "@/components/dashboard/sign-out";

export const metadata={title:"Acceso suspendido",robots:{index:false,follow:false}};

export default async function SuspendedPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  const {data}=await supabase.from("restaurant_members").select("restaurants(name,access_suspended,suspension_reason)").eq("user_id",user.id);
  const restaurant=(data??[]).map(item=>item.restaurants as unknown as {name:string;access_suspended:boolean;suspension_reason:string|null}).find(item=>item?.access_suspended);
  if(!restaurant)redirect("/dashboard");
  return <main className="grid min-h-screen place-items-center p-5"><section className="glass w-full max-w-lg rounded-3xl p-7 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-300"><Ban size={28}/></span><h1 className="mt-5 text-3xl font-bold">Acceso suspendido</h1><p className="mt-2 text-slate-300">El acceso de <strong>{restaurant.name}</strong> está temporalmente suspendido.</p>{restaurant.suspension_reason&&<p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">{restaurant.suspension_reason}</p>}<p className="mt-5 text-sm text-slate-400">Contacta con el administrador de Carta Video para revisar el estado de la cuenta.</p><div className="mt-6 flex justify-center"><SignOut/></div></section></main>;
}
