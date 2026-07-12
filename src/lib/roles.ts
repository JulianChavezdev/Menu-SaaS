export type MemberRole="owner"|"admin"|"editor";
export function canManageTeam(role:MemberRole){return role==="owner"||role==="admin"}
export function canRemoveMember(actor:MemberRole,target:MemberRole){return canManageTeam(actor)&&target!=="owner"}
export function canEditMenu(role:MemberRole){return role==="owner"||role==="admin"||role==="editor"}
