type UserIdentity={id:string;email?:string|null};

function configuredValues(name:string){return new Set((process.env[name]??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean))}

export function isSuperadminUser(user:UserIdentity){
  const ids=configuredValues("SUPERADMIN_USER_IDS");
  const emails=configuredValues("SUPERADMIN_EMAILS");
  return ids.has(user.id.toLowerCase())||Boolean(user.email&&emails.has(user.email.toLowerCase()));
}
