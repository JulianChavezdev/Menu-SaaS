"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireSuperadmin} from "@/lib/superadmin";
import {executeTrashCleanup} from "@/lib/trash-cleanup-run";

export async function retryTrashCleanup(){
  const {admin}=await requireSuperadmin();let status="completed";
  try{await executeTrashCleanup(admin)}catch{status="failed"}
  revalidatePath("/superadmin");revalidatePath("/superadmin/trash");redirect(`/superadmin?cleanup=${status}`);
}
