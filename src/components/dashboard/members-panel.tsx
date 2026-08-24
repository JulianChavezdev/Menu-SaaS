"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { changeMemberRole, inviteMember, removeMember } from "@/app/dashboard/actions";
import { PasswordInput } from "@/components/ui/password-input";
import type { MemberRole } from "@/lib/member-roles";

type Member = { id: string; email: string; role: MemberRole; isCurrent: boolean };
type EditableRole = Exclude<MemberRole, "owner">;
const roles: { value: EditableRole; label: string }[] = [
  { value: "editor", label: "Editor de carta" },
  { value: "admin", label: "Administrador" },
  { value: "waiter", label: "Camarero · solo comandero" },
  { value: "kitchen", label: "Cocina · solo comandas" },
];

function roleLabel(role: MemberRole) {
  return role === "owner" ? "Propietario" : roles.find((item) => item.value === role)?.label ?? role;
}

export function MembersPanel({ members, canManage }: { members: Member[]; canManage: boolean }) {
  const [busy, start] = useTransition();
  const [newRole, setNewRole] = useState<EditableRole>("editor");
  const operational = newRole === "waiter" || newRole === "kitchen";

  return <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
    {canManage && <form action={(form) => start(async () => {
      try {
        const result = await inviteMember(form);
        toast.success(result.directAccess ? "Acceso operativo creado" : "Invitación enviada");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo añadir");
      }
    })} className="glass h-fit rounded-xl p-5">
      <h2 className="font-bold">Añadir al equipo</h2>
      <p className="mt-1 text-sm text-slate-600">Camareros y cocina entran directamente en su herramienta, sin acceso al panel.</p>
      <label className="mt-4 block text-sm font-semibold">{operational ? "Nombre de usuario" : "Correo"}
        <input name="email" required type={operational ? "text" : "email"} minLength={operational ? 3 : undefined} pattern={operational ? "[a-zA-Z0-9._-]+" : undefined} autoComplete="off" placeholder={operational ? "ej. camarero1" : "persona@restaurante.com"} className="mt-1 w-full rounded-lg p-3 text-slate-900" />
      </label>
      <label className="mt-3 block text-sm font-semibold">Rol
        <select name="role" value={newRole} onChange={(event) => setNewRole(event.target.value as EditableRole)} className="mt-1 w-full rounded-lg p-3 text-slate-900">
          {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
      </label>
      {operational && <div className="mt-3">
        <label htmlFor="staff-password" className="block text-sm font-semibold">Contraseña inicial</label>
        <PasswordInput id="staff-password" name="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="w-full rounded-lg p-3 text-slate-900" />
        <p className="mt-1 text-xs text-slate-500">Al entrar en menuly.es irá directamente a {newRole === "waiter" ? "Comandero" : "Cocina"}.</p>
      </div>}
      <button disabled={busy} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Guardando…" : operational ? "Crear acceso" : "Enviar invitación"}</button>
    </form>}
    <div className="space-y-3">{members.map((member) => <article key={member.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
      <div><p className="font-semibold">{member.email.endsWith("@staff.menuly.es") ? member.email.replace("@staff.menuly.es", "") : member.email}{member.isCurrent && <span className="ml-2 text-xs text-orange-800">Tú</span>}</p><p className="text-sm text-slate-700">{roleLabel(member.role)}</p></div>
      {canManage && member.role !== "owner" && <div className="flex items-center gap-2">
        <select aria-label={`Rol de ${member.email}`} value={member.role} onChange={(event) => start(async () => {
          try { await changeMemberRole(member.id, event.target.value as EditableRole); toast.success("Rol actualizado"); }
          catch (error) { toast.error(error instanceof Error ? error.message : "Error"); }
        })} className="rounded-lg bg-white p-2 text-slate-900">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
        <button type="button" aria-label={`Eliminar a ${member.email}`} onClick={() => { if (confirm(`¿Eliminar a ${member.email} del restaurante?`)) start(async () => { try { await removeMember(member.id); toast.success("Miembro eliminado"); } catch (error) { toast.error(error instanceof Error ? error.message : "Error"); } }); }} className="p-2 text-red-700"><Trash2 /></button>
      </div>}
    </article>)}</div>
  </div>;
}
