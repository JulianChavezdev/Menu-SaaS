import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const waiterManifest = JSON.parse(readFileSync("public/manifests/comandero.webmanifest", "utf8"));
const kitchenManifest = JSON.parse(readFileSync("public/manifests/cocina.webmanifest", "utf8"));
const installer = readFileSync("src/components/pwa/install-operational-app.tsx", "utf8");
const navigation = readFileSync("src/app/dashboard/layout.tsx", "utf8");
const navigationComponent = readFileSync("src/components/dashboard/dashboard-navigation.tsx", "utf8");

describe("PWAs operativas", () => {
  it("instala Comandero y Cocina como aplicaciones independientes", () => {
    expect(waiterManifest).toMatchObject({ id: "/operaciones/comandero", start_url: "/operaciones/comandero", scope: "/operaciones/comandero", display: "standalone" });
    expect(kitchenManifest).toMatchObject({ id: "/operaciones/cocina", start_url: "/operaciones/cocina", scope: "/operaciones/cocina", display: "standalone" });
    expect(waiterManifest.id).not.toBe(kitchenManifest.id);
  });

  it("ofrece instalación nativa y guía específica para iOS", () => {
    expect(installer).toContain('addEventListener("beforeinstallprompt"');
    expect(installer).toContain('addEventListener("appinstalled"');
    expect(installer).toContain('navigator.serviceWorker?.register("/sw.js")');
    expect(installer).toContain("Añadir a pantalla de inicio");
  });

  it("sitúa Comandero y Cocina al final de la navegación", () => {
    const waiter = navigation.indexOf('["Comandero", "/operaciones/comandero"]');
    const kitchen = navigation.indexOf('["Cocina", "/operaciones/cocina"]');
    expect(waiter).toBeGreaterThan(navigation.indexOf('["Historial", "/dashboard/orders"]'));
    expect(kitchen).toBeGreaterThan(waiter);
    expect(navigation).toContain("[...links, ...orderingLinks]");
    expect(navigationComponent).toContain('href.startsWith("/operaciones/")');
  });
});
