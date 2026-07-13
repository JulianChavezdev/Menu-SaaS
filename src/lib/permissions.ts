import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {canCreateCategory,canCreateProduct,planForStatus} from "@/lib/plans";

type Restaurant={id:string;name:string;slug:string;is_published:boolean;subscription_status:"trialing"|"active"|"past_due"|"canceled";access_suspended?:boolean;suspension_reason?:string|null;suspended_at?:string|null;language_switcher_enabled?:boolean;menu_template?:string;primary_color:string;secondary_color:string;description:string|null;translations?:Record<string,{name?:string;description?:string}>|null;phone:string|null;email:string|null;address:string|null;instagram_url:string|null;website_url:string|null;logo_url:string|null;cover_url:string|null;currency:string;locale:string;timezone:string};
type Membership={restaurant_id:string;role:string;restaurants:unknown};

function restaurantOf(member:Membership){return member.restaurants as Restaurant}

export async function activeRestaurant(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  const wanted=(await cookies()).get("active_restaurant_id")?.value;
  let member:Membership|null=null;
  if(wanted){
    const result=await supabase.from("restaurant_members").select("restaurant_id,role,restaurants(*)").eq("user_id",user.id).eq("restaurant_id",wanted).maybeSingle();
    member=result.data as Membership|null;
  }
  if(!member||restaurantOf(member).access_suspended){
    const {data}=await supabase.from("restaurant_members").select("restaurant_id,role,restaurants(*)").eq("user_id",user.id).limit(50);
    const memberships=(data??[]) as Membership[];
    member=memberships.find(item=>!restaurantOf(item).access_suspended)??memberships[0]??null;
  }
  if(!member)redirect("/onboarding");
  const restaurant=restaurantOf(member);
  if(restaurant.access_suspended)redirect("/suspended");
  return {supabase,user,member,restaurant};
}

export async function canAddProduct(restaurantId:string){const supabase=await createClient();const[{count},{data:restaurant}]=await Promise.all([supabase.from("products").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurantId),supabase.from("restaurants").select("subscription_status").eq("id",restaurantId).single()]);return canCreateProduct(count??0,planForStatus(restaurant?.subscription_status??"trialing"))}
export async function canAddCategory(restaurantId:string){const supabase=await createClient();const[{count},{data:restaurant}]=await Promise.all([supabase.from("categories").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurantId),supabase.from("restaurants").select("subscription_status").eq("id",restaurantId).single()]);return canCreateCategory(count??0,planForStatus(restaurant?.subscription_status??"trialing"))}
