import {activeRestaurant} from "@/lib/permissions";
import {ProductsManager} from "@/components/dashboard/products-manager";
import {CategoriesManager} from "@/components/dashboard/categories-manager";
import {MediaUpload} from "@/components/dashboard/media-upload";
import {BackButton} from "@/components/ui/back-button";

export default async function Page(){
  const {supabase,restaurant}=await activeRestaurant();
  const[{data:categories},{data:products}]=await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id",restaurant.id).order("sort_order"),
    supabase.from("products").select("*,categories(*)").eq("restaurant_id",restaurant.id).order("sort_order"),
  ]);
  const list=products??[];
  const options=list.map(product=>({id:product.id,name:product.name}));
  return <main className="mx-auto max-w-7xl p-4 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
      <div><BackButton fallback="/dashboard"/><h1 className="mt-4 text-2xl font-extrabold">Gestión de Carta</h1><p className="mt-1 text-sm text-slate-600">Crea platos, ordénalos y asigna un vídeo a cada producto.</p></div>
      <a href={`/r/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="w-full rounded-xl bg-orange-600 text-white px-4 py-3 text-center text-sm font-semibold text-white sm:w-auto">Ver carta oficial ↗</a>
    </div>
    <details id="categorias" className="group mt-5 rounded-3xl border border-stone-200 bg-white p-4 md:p-5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold"><span>Categorías <span className="ml-2 text-sm font-normal text-slate-600">{categories?.length??0}</span></span><span className="text-sm text-orange-700 group-open:hidden">Gestionar</span><span className="hidden text-sm text-orange-700 group-open:inline">Cerrar</span></summary>
      <div className="mt-5 border-t border-stone-200 pt-5"><CategoriesManager categories={categories??[]}/></div>
    </details>
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 rounded-3xl border border-stone-200 bg-white p-4 md:p-5"><h2 className="mb-4 text-lg font-bold">Productos</h2><ProductsManager categories={categories??[]} products={list}/></section>
      <aside className="rounded-3xl border border-stone-200 bg-white p-4 xl:sticky xl:top-5"><h2 className="mb-1 font-semibold">Vídeo del producto</h2><p className="mb-4 text-xs text-slate-500">Selecciona un plato y sube o sustituye su vídeo promocional.</p><MediaUpload restaurantId={restaurant.id} kind="product-video" products={options}/></aside>
    </div>
  </main>;
}
