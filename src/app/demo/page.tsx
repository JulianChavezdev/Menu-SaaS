import type { Metadata } from "next";
import { LandingDemoExperience } from "@/components/menu/landing-demo-experience";

export const metadata: Metadata = {
  title: "Demo interactiva",
  description: "Prueba las plantillas y funciones de la carta digital Menuly.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return (
    <LandingDemoExperience
      slug="bistro-nube"
      restaurantName="Bistro Nube"
      initialTemplate="noirluxe"
    />
  );
}
