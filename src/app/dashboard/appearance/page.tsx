import {activeRestaurant} from "@/lib/permissions";
import {MediaUpload} from "@/components/dashboard/media-upload";
import {AppearancePreferences} from "@/components/dashboard/appearance-preferences";
import {BackButton} from "@/components/ui/back-button";

export default async function Page(){
  const {restaurant,supabase}=await activeRestaurant();
  const {data:product}=await supabase.from("products").select("name,price_cents,video_url,categories(name)").eq("restaurant_id",restaurant.id).eq("is_available",true).order("sort_order").limit(1).maybeSingle();
  const relation=product?.categories as {name:string}|{name:string}[]|null|undefined;
  const previewProduct=product?{name:product.name,priceCents:product.price_cents,videoUrl:product.video_url,category:Array.isArray(relation)?relation[0]?.name??"Carta":relation?.name??"Carta"}:undefined;
  return <main className="mx-auto max-w-5xl p-4 md:p-6">
    <BackButton fallback="/dashboard"/>
    <div className="my-6"><h1 className="text-2xl font-extrabold">Apariencia</h1><p className="mt-1 text-sm text-slate-600">Configura el logo, previsualiza las plantillas y elige los controles de la carta pública.</p></div>
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <MediaUpload restaurantId={restaurant.id} kind="logo" label="Logo del restaurante" currentUrl={restaurant.logo_url}/>
      <AppearancePreferences enabled={Boolean(restaurant.language_switcher_enabled)} template={restaurant.menu_template} canUsePremium={restaurant.subscription_status==="active"} restaurantName={restaurant.name} logoUrl={restaurant.logo_url} currency={restaurant.currency} previewProduct={previewProduct}/>
    </div>
  </main>;
}
