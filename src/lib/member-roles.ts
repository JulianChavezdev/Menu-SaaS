export type MemberRole = "owner" | "admin" | "editor" | "waiter" | "kitchen";

export const operationalRoles: MemberRole[] = ["waiter", "kitchen"];
export const teamRoles: Exclude<MemberRole, "owner">[] = [
  "admin",
  "editor",
  "waiter",
  "kitchen",
];

export function isMemberRole(value: string): value is MemberRole {
  return ["owner", "admin", "editor", "waiter", "kitchen"].includes(value);
}

export function isOperationalRole(role: string) {
  return operationalRoles.includes(role as MemberRole);
}

export function canUseWaiter(role: string) {
  return ["owner", "admin", "editor", "waiter"].includes(role);
}

export function canUseKitchen(role: string) {
  return ["owner", "admin", "editor", "kitchen"].includes(role);
}

export function memberHome(role: string) {
  if (role === "waiter") return "/operaciones/comandero";
  if (role === "kitchen") return "/operaciones/cocina";
  return "/dashboard";
}
