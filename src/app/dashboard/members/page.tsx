import { createClient as createAdminClient } from "@supabase/supabase-js";
import { activeRestaurant } from "@/lib/permissions";
import { MembersPanel } from "@/components/dashboard/members-panel";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";
import type { MemberRole } from "@/lib/member-roles";

export default async function Page() {
  const { restaurant, member, user } = await activeRestaurant();
  const key = getSupabaseSecretKey();
  let members: { id: string; email: string; role: MemberRole; isCurrent: boolean }[] = [];
  if (key) {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
    const [{ data: rows }, { data: users }] = await Promise.all([
      admin.from("restaurant_members").select("id,user_id,role").eq("restaurant_id", restaurant.id).order("created_at"),
      admin.auth.admin.listUsers(),
    ]);
    const emailById = new Map((users?.users ?? []).map((item) => [item.id, item.email ?? "Usuario sin correo"]));
    members = (rows ?? []).map((row) => ({ id: row.id, email: emailById.get(row.user_id) ?? "Usuario", role: row.role as MemberRole, isCurrent: row.user_id === user.id }));
  }
  return <main className="mx-auto max-w-5xl p-6"><h1 className="mb-6 text-3xl font-bold">Equipo</h1><p className="mb-6 text-slate-700">Crea accesos limitados para camareros y cocina sin compartir la cuenta del propietario.</p><MembersPanel members={members} canManage={member.role === "owner" || member.role === "admin"} /></main>;
}
