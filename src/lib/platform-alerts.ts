import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";

export type PlatformAlertKind = "registration" | "menu_created" | "published" | "failure";
type AlertInput = {
  kind: PlatformAlertKind;
  title: string;
  message: string;
  restaurantId?: string | null;
  details?: Record<string, unknown>;
};

export function platformAlertsEnabled() {
  if (process.env.OPERATIONS_ALERTS_ENABLED === "true") return true;
  if (process.env.OPERATIONS_ALERTS_ENABLED === "false") return false;
  return process.env.VERCEL_ENV === "production";
}

export function isLocalDevelopmentFailure(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return false;
  const message = String((details as Record<string, unknown>).message ?? "");
  return /segment-explorer-node|React Client Manifest|__webpack_modules__|[A-Z]:\\Users\\/i.test(message);
}

function safeText(value: string, max = 500) {
  return value.replace(/(sb_(?:secret|publishable)_[A-Za-z0-9_-]+)/g, "[secret]").slice(0, max);
}

export async function recordPlatformAlert(input: AlertInput) {
  try {
    if (!platformAlertsEnabled()) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = getSupabaseSecretKey();
    if (!url || !key) return;
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const title = safeText(input.title, 120);
    const message = safeText(input.message);
    const details = { title, message, ...(input.details ?? {}) };

    if (input.kind === "failure") {
      const since = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data: recent } = await admin.from("superadmin_audit_log").select("details").eq("action", "alert.failure").gte("created_at", since).order("created_at", { ascending: false }).limit(20);
      if ((recent ?? []).some((row) => row.details && typeof row.details === "object" && (row.details as Record<string, unknown>).message === message)) return;
    }
    if (input.kind === "registration" && typeof input.details?.accountId === "string") {
      const { data: previous } = await admin.from("superadmin_audit_log").select("id").eq("action", "alert.registration").contains("details", { accountId: input.details.accountId }).limit(1);
      if (previous?.length) return;
    }

    await admin.from("superadmin_audit_log").insert({
      restaurant_id: input.restaurantId ?? null,
      action: `alert.${input.kind}`,
      details,
    });

    const webhook = process.env.OPERATIONS_ALERT_WEBHOOK_URL?.trim();
    if (webhook && webhook.startsWith("https://")) {
      const notificationText = `[Menuly] ${title}: ${message}`;
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "Menuly",
          event: input.kind,
          severity: input.kind === "failure" ? "error" : "info",
          title,
          message,
          text: notificationText,
          content: notificationText,
          restaurantId: input.restaurantId ?? null,
          occurredAt: new Date().toISOString(),
          details: input.details ?? {},
        }),
        signal: AbortSignal.timeout(5_000),
      }).catch(() => undefined);
    }
  } catch {
    // Alerting must never break the customer operation that generated it.
  }
}
