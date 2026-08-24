import { redirect } from "next/navigation";
import { activeRestaurant } from "@/lib/permissions";
import { memberHome } from "@/lib/member-roles";

export default async function AccessPage() {
  const { member } = await activeRestaurant();
  redirect(memberHome(member.role));
}
