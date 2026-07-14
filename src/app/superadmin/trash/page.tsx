import Link from "next/link";
import {ArchiveRestore,Clock3,Trash2} from "lucide-react";
import {restoreDeletedRestaurant} from "@/app/superadmin/actions";
import {requireSuperadmin} from "@/lib/superadmin";
import {isRestaurantTrashRestorable,restaurantRestoreDeadline,RESTAURANT_RESTORE_DAYS} from "@/lib/restaurant-trash";

type DeletionDetails={restaurant_name?:unknown;slug?:unknown;backup?:{restaurant?:{id?:unknown}}};
type EventDetails={deletion_audit_id?:unknown};

export default async function RestaurantTrashPage(){
  const {admin}=await requireSuperadmin();
  const cutoff=new Date(Date.now()-RESTAURANT_RESTORE_DAYS*24*60*60*1000).toISOString();
  const[{data:deletions,error},{data:restorations,error:restorationError}]=await Promise.all([
    admin.from("superadmin_audit_log").select("id,details,created_at").eq("action","restaurant.deletion_backup_created").gte("created_at",cutoff).order("created_at",{ascending:false}).limit(100),
    admin.from("superadmin_audit_log").select("details").eq("action","restaurant.restored_from_trash").gte("created_at",cutoff).limit(100),
  ]);
  if(error||restorationError)throw new Error(error?.message??restorationError?.message);
  const restoredIds=new Set((restorations??[]).map(item=>(item.details as EventDetails)?.deletion_audit_id).filter((id):id is string=>typeof id==="string"));
  const entries=(deletions??[]).flatMap(entry=>{
    const details=entry.details as DeletionDetails;
    const name=details?.restaurant_name;const slug=details?.slug;const restaurantId=details?.backup?.restaurant?.id;
    if(typeof name!=="string"||typeof slug!=="string"||typeof restaurantId!=="string"||restoredIds.has(entry.id)||!isRestaurantTrashRestorable(entry.created_at))return[];
    return[{id:entry.id,name,slug,restaurantId,deletedAt:new Date(entry.created_at),restoreUntil:restaurantRestoreDeadline(entry.created_at)}];
  });
  return <main className="mx-auto max-w-5xl p-4 md:p-6"><Link href="/superadmin" className="text-sm text-violet-300 hover:text-violet-200">← Volver a restaurantes</Link><div className="mt-5 flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-300"><Trash2 size={23}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-red-300">Recuperación segura</p><h1 className="mt-1 text-3xl font-extrabold">Papelera de restaurantes</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Puedes recuperar un restaurante durante {RESTAURANT_RESTORE_DAYS} días. Se restaurará suspendido y sin publicar para que revises sus datos antes de reactivarlo. Una limpieza automática diaria elimina las copias y medios cuando vence el plazo.</p></div></div>
    <section className="mt-7 space-y-3">{entries.map(entry=>{const days=Math.max(1,Math.ceil((entry.restoreUntil.getTime()-Date.now())/(24*60*60*1000)));return <article key={entry.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="truncate text-lg font-bold">{entry.name}</h2><p className="mt-1 text-xs text-slate-500">/{entry.slug} · eliminado {new Intl.DateTimeFormat("es-ES",{dateStyle:"medium"}).format(entry.deletedAt)}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300"><Clock3 size={14}/>Quedan {days} días para restaurarlo</p></div><form action={restoreDeletedRestaurant}><input type="hidden" name="audit_id" value={entry.id}/><button className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold hover:bg-violet-500"><ArchiveRestore size={17}/>Restaurar suspendido</button></form></article>})}{!entries.length&&<div className="rounded-3xl border border-dashed border-white/15 p-10 text-center"><Trash2 className="mx-auto text-slate-600" size={32}/><h2 className="mt-3 font-bold">La papelera está vacía</h2><p className="mt-1 text-sm text-slate-500">Aquí aparecerán los restaurantes eliminados durante su periodo de recuperación.</p></div>}</section>
  </main>;
}
