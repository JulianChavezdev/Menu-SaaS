import {activeRestaurant} from "@/lib/permissions";
import {MediaUpload} from "@/components/dashboard/media-upload";
import {AppearancePreferences} from "@/components/dashboard/appearance-preferences";

export default async function Page(){
  const {restaurant,supabase}=await activeRestaurant();
  const {data:product}=await supabase.from("products").select("name,price_cents,video_url,categories(name)").eq("restaurant_id",restaurant.id).eq("is_available",true).order("sort_order").limit(1).maybeSingle();
  const relation=product?.categories as {name:string}|{name:string}[]|null|undefined;
  const previewProduct=product?{name:product.name,priceCents:product.price_cents,videoUrl:product.video_url,category:Array.isArray(relation)?relation[0]?.name??"Carta":relation?.name??"Carta"}:undefined;
  return <main className="workspace-page appearance-page">
    <header className="workspace-heading"><div><h1>Apariencia</h1><p className="workspace-description">Diseña cómo ven tus clientes la carta.</p></div></header>
    <AppearancePreferences enabled={Boolean(restaurant.language_switcher_enabled)} template={restaurant.menu_template} canUsePremium={["active","trialing"].includes(restaurant.subscription_status)} restaurantName={restaurant.name} logoUrl={restaurant.logo_url} currency={restaurant.currency} previewProduct={previewProduct}
      logoEditor={<MediaUpload restaurantId={restaurant.id} kind="logo" label="Logo del restaurante" currentUrl={restaurant.logo_url}/>}/>
  </main>;
}
