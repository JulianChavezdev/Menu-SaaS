import { redirect } from "next/navigation";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const table = (await searchParams).table;
  redirect(table ? `/operaciones/comandero?table=${encodeURIComponent(table)}` : "/operaciones/comandero");
}
