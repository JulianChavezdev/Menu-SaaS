import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { recordPlatformAlert } from "@/lib/platform-alerts";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";

const inputSchema = z.object({ userId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseSecretKey();
  if (!parsed.success || !url || !key) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.getUserById(parsed.data.userId);
  if (error || !data.user) return NextResponse.json({ ok: false }, { status: 404 });
  const accountAge = Date.now() - new Date(data.user.created_at).getTime();
  if (!Number.isFinite(accountAge) || accountAge > 15 * 60_000) return NextResponse.json({ ok: true });

  await recordPlatformAlert({
    kind: "registration",
    title: "Nueva cuenta registrada",
    message: "Una nueva cuenta se ha registrado en Menuly.",
    details: { accountId: data.user.id, plan: data.user.user_metadata?.plan_interest ?? "carta" },
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
