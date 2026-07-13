import type {MetadataRoute} from "next";
import {normalizedAppUrl} from "@/lib/app-url";

export default function robots():MetadataRoute.Robots{
  const base=normalizedAppUrl();
  return {
    rules:{
      userAgent:"*",
      allow:["/","/r/"],
      disallow:["/api/","/auth/","/dashboard/","/login","/register","/onboarding","/forgot-password","/reset-password"],
    },
    sitemap:`${base}/sitemap.xml`,
  };
}
