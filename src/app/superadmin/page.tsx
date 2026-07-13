import {Ban,Building2,Globe2,Users} from "lucide-react";
import {requireSuperadmin} from "@/lib/superadmin";
import {RestaurantsTable,type ManagedRestaurant} from "@/components/superadmin/restaurants-table";

function countRelation(value:unknown){return Array.isArray(value)?Number((value[0] as {count?:number}|undefined)?.count??0):0}

export default async function SuperadminPage(){
  const {admin}=await requireSuperadmin();
  const {data,error}=await admin.from("restaurants").select("id,name,slug,is_published,access_suspended,subscription_status,menu_template,created_at,products(count),categories(count),restaurant_members(count)").order("created_at",{ascending:false});
  if(error)throw new Error(error.message);
  const restaurants:ManagedRestaurant[]=(data??[]).map(item=>({id:item.id,name:item.name,slug:item.slug,isPublished:item.is_published,isSuspended:Boolean(item.access_suspended),status:item.subscription_status,template:item.menu_template,products:countRelation(item.products),categories:countRelation(item.categories),members:countRelation(item.restaurant_members),createdAt:item.created_at}));
  const published=restaurants.filter(item=>item.isPublished&&!item.isSuspended).length;
  const suspended=restaurants.filter(item=>item.isSuspended).length;
  const members=restaurants.reduce((total,item)=>total+item.members,0);
  return <main className="mx-auto max-w-7xl p-4 md:p-6"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Control de plataforma</p><h1 className="mt-2 text-3xl font-extrabold">Restaurantes</h1><p className="mt-1 text-sm text-slate-400">Gestiona soporte, publicación y acceso manual mientras los cobros están desactivados.</p></div><section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={<Building2/>} label="Restaurantes" value={restaurants.length}/><Metric icon={<Globe2/>} label="Publicados" value={published}/><Metric icon={<Users/>} label="Miembros" value={members}/><Metric icon={<Ban/>} label="Suspendidos" value={suspended} danger={suspended>0}/></section><RestaurantsTable restaurants={restaurants}/></main>;
}

function Metric({icon,label,value,danger=false}:{icon:React.ReactNode;label:string;value:number;danger?:boolean}){return <div className={`rounded-2xl border p-4 ${danger?"border-red-500/25 bg-red-500/[.07]":"border-white/10 bg-slate-950/50"}`}><div className={`flex items-center gap-2 text-xs font-semibold uppercase ${danger?"text-red-300":"text-slate-500"}`}>{icon}{label}</div><p className="mt-3 text-3xl font-black tabular-nums">{value}</p></div>}
