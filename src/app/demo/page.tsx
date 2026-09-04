import type { Metadata } from "next";
import { headers } from "next/headers";
import { LandingDemoExperience } from "@/components/menu/landing-demo-experience";
import { VideoMenu } from "@/components/menu/video-menu";
import { demoProducts, demoRestaurant } from "@/lib/demo";

const LANDING_PREVIEW_VIDEO =
  "https://res.cloudinary.com/det6jfwzx/video/upload/c_limit,w_480/q_auto:eco/vc_h264/f_mp4/v1783700256/Generame_un_video_de_una_hambu_oo9gur.mp4";

export const metadata: Metadata = {
  title: "Demo interactiva",
  description: "Prueba las plantillas y funciones de la carta digital Menuly.",
  robots: { index: false, follow: false },
};

export default async function DemoPage() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const isPhone =
    /iPhone|iPod|Windows Phone|IEMobile|Opera Mini/i.test(userAgent) ||
    /Android.*Mobile/i.test(userAgent);

  if (isPhone) {
    const products = demoProducts.map((product, index) =>
      index === 0
        ? { ...product, video_url: LANDING_PREVIEW_VIDEO }
        : product,
    );
    return (
      <VideoMenu
        restaurant={demoRestaurant}
        products={products}
        analyticsEnabled={false}
        introEnabled={false}
      />
    );
  }

  return (
    <LandingDemoExperience
      slug="bistro-nube"
      restaurantName="Bistro Nube"
      initialTemplate="noirluxe"
    />
  );
}
