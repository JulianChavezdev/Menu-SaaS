"use client";

import { useEffect } from "react";

type OperationalApp = "comandero" | "cocina";

export function OperationalAppGuard({ app }: { app: OperationalApp }) {
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (!standalone) return;

    const requestedApp = new URLSearchParams(location.search).get("app");
    const referrerIsInternal = (() => {
      if (!document.referrer) return false;
      try {
        return new URL(document.referrer).origin === location.origin;
      } catch {
        return false;
      }
    })();
    const storageKey = "menuly:installed-operational-app";
    let installedApp = sessionStorage.getItem(storageKey);
    if (!installedApp && (requestedApp === app || !referrerIsInternal)) {
      installedApp = app;
      sessionStorage.setItem(storageKey, app);
    }
    if (installedApp !== app) return;

    document.documentElement.dataset.operationalApp = app;
    const guardState = { ...history.state, menulyOperationalGuard: app };
    history.replaceState(guardState, "", location.href);
    history.pushState(guardState, "", location.href);

    const blockBack = () => history.pushState(guardState, "", location.href);
    const blockExternalNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const target = new URL(link.href, location.href);
      if (target.origin !== location.origin || !target.pathname.startsWith(`/operaciones/${app}`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    addEventListener("popstate", blockBack);
    document.addEventListener("click", blockExternalNavigation, true);
    return () => {
      removeEventListener("popstate", blockBack);
      document.removeEventListener("click", blockExternalNavigation, true);
      delete document.documentElement.dataset.operationalApp;
    };
  }, [app]);

  return null;
}
