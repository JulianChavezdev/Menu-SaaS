export type CleanupRun={action:string;created_at:string;details?:unknown};
export type CleanupHealth="pending"|"healthy"|"failed"|"stale";

export function cleanupHealth(run:CleanupRun|null|undefined,now=new Date(),staleAfterHours=36):CleanupHealth{
  if(!run)return"pending";
  if(run.action==="platform.trash_cleanup_failed")return"failed";
  const createdAt=new Date(run.created_at).getTime();
  if(!Number.isFinite(createdAt)||now.getTime()-createdAt>staleAfterHours*60*60*1000)return"stale";
  return"healthy";
}
