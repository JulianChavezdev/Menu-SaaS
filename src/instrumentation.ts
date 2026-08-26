import type { Instrumentation } from "next";
import { recordPlatformAlert } from "@/lib/platform-alerts";

export async function register() {}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await recordPlatformAlert({
    kind: "failure",
    title: "Fallo del servidor",
    message: error instanceof Error ? error.message : String(error),
    details: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routeType: context.routeType,
      routePath: context.routePath,
    },
  });
};
