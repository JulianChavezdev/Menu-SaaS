import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const alerts = readFileSync("src/lib/platform-alerts.ts", "utf8");
const registration = readFileSync("src/app/api/alerts/registration/route.ts", "utf8");
const actions = readFileSync("src/app/dashboard/actions.ts", "utf8");
const instrumentation = readFileSync("src/instrumentation.ts", "utf8");
const alertsPage = readFileSync("src/app/superadmin/alerts/page.tsx", "utf8");

describe("alertas operativas", () => {
  it("registra cuentas verificadas por el servidor sin exponer el correo", () => {
    expect(registration).toContain("auth.admin.getUserById");
    expect(registration).toContain('kind: "registration"');
    expect(registration).not.toContain("data.user.email");
  });

  it("separa la creación y la publicación de una carta", () => {
    expect(actions).toContain('kind:"menu_created"');
    expect(actions).toContain('kind:"published"');
  });

  it("captura fallos del servidor y evita duplicados", () => {
    expect(instrumentation).toContain("onRequestError");
    expect(alerts).toContain('input.kind === "failure"');
    expect(alerts).toContain("5 * 60_000");
    expect(alerts).toContain('process.env.VERCEL_ENV === "production"');
    expect(alerts).toContain("isLocalDevelopmentFailure");
    expect(alertsPage).toContain("isLocalDevelopmentFailure");
  });

  it("ofrece bandeja privada y webhook opcional", () => {
    expect(alertsPage).toContain('requireSuperadmin()');
    expect(alertsPage).toContain('like("action", "alert.%")');
    expect(alerts).toContain("OPERATIONS_ALERT_WEBHOOK_URL");
    expect(alerts).toContain("notificationText");
  });
});
