import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Languages,
  MessageCircle,
  Play,
  QrCode,
  ShoppingBag,
  Users,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { getLegalIdentity, legalLinks } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Menuly | Carta digital en vídeo para restaurantes",
  description:
    "Transforma tu carta en una experiencia visual inmersiva con vídeos verticales, QR, traducción automática y analíticas.",
};

const faqs = [
  [
    "¿Necesito instalar una aplicación?",
    "No. Gestionas Menuly desde el navegador y tus clientes abren la carta escaneando un QR.",
  ],
  [
    "¿La carta funciona en cualquier móvil?",
    "Sí. Está diseñada mobile-first y se adapta también a tablet y ordenador.",
  ],
  [
    "¿Los pedidos llegan a cocina?",
    "En Plan Carta, el carrito no envía comandas. Menuly Comandas sí conecta el comandero móvil con Cocina, aunque no sustituye un TPV fiscal.",
  ],
  [
    "¿Puedo usar mis propios vídeos?",
    "Sí. Puedes subir fotos, vídeos verticales y archivos MOV desde el panel del restaurante.",
  ],
  [
    "¿Tengo que traducir cada plato?",
    "No. Escribes en español y Menuly genera automáticamente la versión inglesa cuando el servicio está activado.",
  ],
  [
    "¿Puedo cambiar la carta después de publicarla?",
    "Sí. Los cambios aparecen en la misma URL y QR sin necesidad de volver a imprimirlo.",
  ],
  [
    "¿Qué ocurre si la carta deja de funcionar?",
    "Soporte prioritario todos los días. Las incidencias críticas se revisan con la máxima prioridad.",
  ],
] as const;

const plans = [
  {
    name: "Plan Carta",
    price: "34,99 €",
    suffix: "/mes",
    note: "344,30 €/año · ahorra un 18%",
    description:
      "La experiencia completa para gestionar una carta profesional.",
    features: [
      "Hasta 100 productos",
      "Categorías ilimitadas",
      "6 plantillas",
      "Traducción automática ES/EN",
      "Carrito y analíticas privadas",
      "Soporte prioritario",
    ],
    href: "/register?plan=carta",
    cta: "Elegir Plan Carta",
    featured: true,
  },
  {
    name: "Menuly Comandas",
    price: "59,99 €",
    suffix: "/mes",
    note: "590,30 €/año · ahorra un 18%",
    description:
      "Comandero móvil conectado en tiempo real con la pantalla de Cocina.",
    features: [
      "Todo Plan Carta",
      "Comandero para camareros",
      "Organización por mesas",
      "Cocina en tiempo real",
      "Observaciones e historial",
    ],
    href: "/register?plan=pedidos",
    cta: "Elegir Comandas",
  },
  {
    name: "Configuración completa",
    price: "149,99 €",
    suffix: " pago único",
    description:
      "Para restaurantes sin tiempo, vídeos ni equipo audiovisual propio.",
    features: [
      "Grabación de tus platos",
      "Edición de vídeos con IA",
      "Carta configurada por Menuly",
      "Primer mes de Plan Carta incluido",
      "Segundo mes de Plan Carta gratis",
    ],
    href: "/register?plan=configuracion",
    cta: "Contactar con ventas",
  },
] as const;

export default function Home() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const legalIdentity = getLegalIdentity();
  return (
    <main className="min-w-0 overflow-x-clip bg-[#0f0f0f] font-[family-name:var(--font-marketing-body)] text-[#f5f0eb] selection:bg-[#d4943a] selection:text-[#0b0b0c]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[10px] focus:bg-[#f5a623] focus:px-4 focus:py-2 focus:text-[#0b0b0c]"
      >
        Saltar al contenido
      </a>
      <MarketingNav />

      <section
        id="inicio"
        className="scroll-mt-20 px-5 pb-16 pt-28 sm:px-8 lg:h-[639px] lg:px-0 lg:pb-0 lg:pt-[96px] min-[1600px]:h-[100vh] min-[1600px]:min-h-[900px] min-[1600px]:max-h-[1000px] min-[1600px]:pt-[150px]"
      >
        <div
          id="contenido"
          className="mx-auto grid max-w-[1339px] items-center gap-12 lg:h-[543px] lg:grid-cols-[549px_654px] lg:gap-[105px] min-[1600px]:h-[724px] min-[1600px]:max-w-[1745px] min-[1600px]:grid-cols-[720px_872px] min-[1600px]:gap-[88px]"
        >
          <div className="max-w-[549px] min-[1600px]:max-w-[720px] min-[1600px]:-translate-y-5">
            <h1 className="font-[family-name:var(--font-marketing-sans)] text-[clamp(3rem,13vw,4rem)] font-extrabold leading-[1.08] tracking-[-.045em] text-[#f4ede4] lg:text-[64px] lg:leading-[74px] lg:tracking-[-2.1525px] min-[1600px]:text-[88px] min-[1600px]:leading-[99px] min-[1600px]:tracking-[-3px]">
              La carta que
              <br />
              <span className="text-[#d4943a]">entra por los ojos</span>
            </h1>
            <p className="mt-5 max-w-[448px] text-base leading-7 text-[#9e8e7e] lg:text-[18px] lg:leading-[29.25px] min-[1600px]:mt-12 min-[1600px]:max-w-[610px] min-[1600px]:text-[24px] min-[1600px]:leading-[39px]">
              Transforma tu carta en una experiencia visual inmersiva. Vídeos
              verticales que seducen, inspiran y convierten visitas en pedidos.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row min-[1600px]:mt-10 min-[1600px]:gap-4">
              <Link
                href="/register"
                className="inline-flex h-[50.53px] items-center justify-center rounded-[40px] bg-[#d4943a] px-7 text-[14px] font-semibold text-[#0c0a08] shadow-[0_0_20px_rgba(212,148,58,.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e3a64d] sm:w-[200.57px] min-[1600px]:h-[68px] min-[1600px]:w-[268px] min-[1600px]:text-[18px]"
              >
                Crear mi carta
              </Link>
              <Link
                href="/r/bistro-nube"
                className="inline-flex h-[50.53px] items-center justify-center gap-2 rounded-[40px] border-2 border-[#d4943a] px-7 text-[14px] font-medium text-[#f4ede4] transition duration-300 hover:bg-[#d4943a]/10 sm:w-[171.95px] min-[1600px]:h-[68px] min-[1600px]:w-[230px] min-[1600px]:text-[18px]"
              >
                <Play size={15} fill="#d4943a" className="text-[#d4943a]" />
                Probar la demo
              </Link>
            </div>
          </div>
          <HeroCards />
        </div>
      </section>

      <section
        id="producto"
        className="scroll-mt-20 px-5 py-16 sm:px-8 lg:h-[585px] lg:px-0 lg:py-0"
      >
        <span className="sr-only">seis estilos visuales</span>
        <div className="mx-auto grid max-w-[1344px] items-center gap-14 lg:h-full lg:grid-cols-[672px_672px] lg:gap-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:h-[429.73px] lg:w-[672px]">
            <FeatureCard
              icon={<Languages size={22} />}
              title="Traducción automática"
              text="Tu carta en español e inglés al instante, sin duplicar trabajo."
              visual={
                <div className="text-center">
                  <span className="text-[10px] text-[#77716b]">English</span>
                  <p className="mt-1 text-sm font-bold">
                    Tuna tartare with avocado
                  </p>
                  <p className="text-[10px] text-[#85817d]">
                    Fresh bluefin tuna, soy, sesame
                  </p>
                  <div className="mt-3 flex justify-center gap-5 text-[9px]">
                    <span>ES</span>
                    <span className="text-[#d4943a]">EN</span>
                  </div>
                </div>
              }
            />
            <FeatureCard
              icon={<ShoppingBag size={22} />}
              title="Carrito local"
              text="El cliente prepara su selección antes de decidir qué pedir."
              visual={
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between border-b border-white/[.06] pb-2">
                    <span>
                      <b className="mr-2 rounded-full bg-[#2b2926] px-1.5 py-1 text-[#d4943a]">
                        1
                      </b>
                      Tartar de atún
                    </span>
                    <b className="text-[#d4943a]">€14</b>
                  </div>
                  <div className="flex justify-between border-b border-white/[.06] pb-2">
                    <span>
                      <b className="mr-2 rounded-full bg-[#2b2926] px-1.5 py-1 text-[#d4943a]">
                        2
                      </b>
                      Chuletón
                    </span>
                    <b className="text-[#d4943a]">€76</b>
                  </div>
                  <div className="flex justify-between pt-1 text-[#a09890]">
                    <span>Total</span>
                    <b className="text-white">€90</b>
                  </div>
                </div>
              }
            />
            <FeatureCard
              icon={<BarChart3 size={22} />}
              title="Analíticas privadas"
              text="Descubre qué platos generan más interés sin cookies de terceros."
              visual={
                <div className="flex h-16 items-end justify-between gap-2">
                  {[22, 42, 31, 58, 25, 48, 20].map((height, index) => (
                    <span
                      key={index}
                      className={`w-full rounded-t-[5px] ${index === 3 ? "bg-[#d4a853]" : "bg-[#353432]"}`}
                      style={{ height }}
                    />
                  ))}
                </div>
              }
            />
            <FeatureCard
              icon={<Users size={22} />}
              title="Equipo y soporte"
              text="Roles separados y soporte humano para gestionar el servicio con seguridad."
              visual={
                <div className="flex justify-center gap-3">
                  {[
                    ["MA", "#d4a853"],
                    ["LP", "#f0643a"],
                    ["JR", "#79aee8"],
                  ].map(([label, color]) => (
                    <span
                      key={label}
                      style={{ backgroundColor: color }}
                      className="grid size-10 place-items-center rounded-full text-[10px] font-bold text-[#111]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              }
            />
          </div>
          <div className="flex min-h-[232px] w-full flex-col items-center justify-center text-center">
            <p className="font-[family-name:var(--font-marketing-sans)] text-[32px] font-extrabold leading-[48px] tracking-[-.8px]">
              Todo en <span className="text-[#d4943a]">un solo lugar</span>
            </p>
            <p className="mx-auto mt-3 max-w-[384px] text-[18px] leading-[22.75px] text-[#a09890]">
              Mucho más que un PDF con QR — Una experiencia de descubrimiento
              para el cliente en formato reel y un panel de control real para el
              restaurante.
            </p>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-20 px-5 py-20 sm:px-8 lg:mt-[84px] lg:h-[1327px] lg:px-0 lg:py-0"
      >
        <div className="mx-auto max-w-[1155.2px]">
          <div className="h-20 text-center">
            <h2 className="font-[family-name:var(--font-marketing-sans)] text-[32px] font-extrabold leading-[48px] tracking-[-.8px]">
              De cero a <span className="text-[#d4943a]">publicada</span>
            </h2>
            <p className="mt-3 text-[18px] leading-5 text-[#a09890]">
              Tres pasos. Un QR. Infinitos cambios.
            </p>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[512px_403px] lg:items-center lg:gap-[138px]">
            <div>
              <ProcessStep
                number="01"
                title="Configura tu restaurante"
                text="Nombre, plantilla, idiomas y branding en menos de 5 minutos."
              >
                <SettingsMockup />
              </ProcessStep>
              <ProcessStep
                number="02"
                title="Sube carta y vídeos"
                text="Añade platos con foto, vídeo, descripción y precio. Actualiza en cualquier momento."
              >
                <MenuMockup />
              </ProcessStep>
              <ProcessStep
                number="03"
                title="Comparte tu QR"
                text="Imprime o comparte el QR — tu carta está activa en tiempo real."
              >
                <QrMockup />
              </ProcessStep>
            </div>
            <div className="relative mx-auto aspect-[403/713] w-full max-w-[403px] overflow-hidden rounded-[20.8px] border border-[#d4943a]/35 bg-[#181410] shadow-[0_0_45px_rgba(212,148,58,.14)]">
              <Image
                src="/landing/figma/asset-8.png"
                alt="Vista de un plato en Menuly"
                fill
                sizes="403px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between text-xs">
                <span className="rounded-[8px] border border-white/20 bg-black/35 px-2 py-1">
                  ←
                </span>
                <strong>BISTRO NUBE</strong>
                <span className="rounded-[8px] border border-white/20 bg-black/35 px-2 py-1">
                  EN
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-marketing-sans)] text-xl font-bold">
                      Alcachofas con jamón
                    </h3>
                    <p className="mt-1 text-xs text-white/70">Descripción</p>
                  </div>
                  <strong className="text-[#fcd34d]">12,90 €</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="precios"
        className="scroll-mt-20 px-5 py-20 sm:px-8 lg:mt-12 lg:h-[649px] lg:px-0 lg:py-8"
      >
        <span className="sr-only">
          No ofrecemos una prueba gratuita general
        </span>
        <div className="mx-auto max-w-[1395px]">
          <div className="h-20 text-center">
            <h2 className="font-[family-name:var(--font-marketing-sans)] text-[32px] font-extrabold leading-[48px] tracking-[-.8px]">
              <span className="text-[#d4943a]">Precios</span> claros
            </h2>
            <p className="mt-3 text-[18px] leading-5 text-[#a09890]">
              Elige cómo quieres poner Menuly en marcha.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-[896px] gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <PriceCard key={plan.name} {...plan} />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[10px] leading-4 text-[#77716b]">
            Activación y pagos gestionados manualmente. No se realizará ningún
            cargo automático.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-20 px-5 py-20 sm:px-8 lg:mt-12 lg:h-[580px] lg:px-0 lg:py-8"
      >
        <div className="mx-auto max-w-[576px]">
          <h2 className="text-center font-[family-name:var(--font-marketing-sans)] text-[32px] font-extrabold leading-9 tracking-[-.8px]">
            <span className="text-[#d4943a]">Preguntas</span> frecuentes
          </h2>
          <div className="mt-12 divide-y divide-[#2a2a2a] rounded-[16px] border border-[#2a2a2a] bg-[#1a1a1a] px-6">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group">
                <summary className="flex min-h-[68.8px] cursor-pointer list-none items-center justify-between gap-5 text-[13px] font-semibold leading-5">
                  <span>{question}</span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#292929] text-[#a09890] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[500px] pb-5 pr-10 text-[12px] leading-5 text-[#a09890]">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contacto"
        className="relative scroll-mt-20 overflow-hidden px-5 py-20 text-center sm:px-8 lg:mt-12 lg:h-[352px] lg:px-0 lg:py-20"
      >
        <span className="sr-only">+34 643 663 194</span>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(83,39,26,.28),transparent_55%)]" />
        <div className="relative mx-auto max-w-[512px]">
          <h2 className="font-[family-name:var(--font-marketing-sans)] text-[32px] font-extrabold leading-10 tracking-[-.8px]">
            ¿Listo para que tu carta se vea
            <br />
            como sabe?
          </h2>
          <p className="mt-3 text-[13px] leading-5 text-[#a09890]">
            Empieza a convertir la curiosidad en pedidos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/34643663194?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Menuly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[40px] bg-[#14c75a] px-[22px] text-[13px] font-bold text-white"
            >
              <MessageCircle size={16} />
              Preguntar por WhatsApp
            </a>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[40px] bg-[#d4943a] px-[23px] text-[13px] font-bold text-[#0b0b0c]"
            >
              <span>Crear mi carta</span>
              <ArrowRight size={16} />
            </Link>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent("Información sobre Menuly")}`}
                className="sr-only"
              >
                Correo
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-white/[.08] px-5 py-10 sm:px-8 lg:h-[305px] lg:px-[71.5px] lg:py-[40.8px]">
        <div className="mx-auto grid max-w-[1292px] items-center gap-8 lg:h-[203px] lg:grid-cols-[264px_732px_264px]">
          <Link
            href="#inicio"
            className="font-[family-name:var(--font-marketing-sans)] text-[18px] font-extrabold leading-7 tracking-[-.45px] text-[#d4943a]"
          >
            Menuly
          </Link>
          <nav
            aria-label="Navegación del pie"
            className="flex flex-wrap justify-center gap-x-7 gap-y-3 text-[11px] leading-4 text-[#a09890] lg:flex-col lg:items-center lg:gap-5"
          >
            <a href="#inicio">Inicio</a>
            <a href="#precios">Precios</a>
            <a href="#faq">FAQ</a>
            <a
              href="/manual-menuly-restaurantes.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Manual
            </a>
            <Link href="/login">Acceder</Link>
            {legalIdentity.complete &&
              legalLinks.slice(0, 4).map((link) => (
                <Link className="lg:hidden" key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
          </nav>
          <span />
        </div>
        <p className="mx-auto text-center text-[10px] leading-4 text-[#77716b]">
          © {new Date().getFullYear()} Menuly. Cartas que despiertan el apetito.
        </p>
      </footer>
    </main>
  );
}

function HeroCards() {
  const cards = [
    {
      src: "/landing/figma/asset-3.png",
      title: "Pizza Margarita",
      price: "8,90 €",
      position:
        "lg:left-[44px] lg:top-[89px] lg:-rotate-[16deg] min-[1600px]:left-[65px] min-[1600px]:top-[119px]",
    },
    {
      src: "/landing/figma/dish-1.jpg",
      title: "Alcachofas con jamón",
      price: "12,90 €",
      position:
        "lg:left-[213px] lg:top-[45px] lg:z-10 min-[1600px]:left-[332px] min-[1600px]:top-[45px]",
    },
    {
      src: "/landing/figma/asset-7.png",
      title: "Hamburguesa Nebulosa",
      price: "10,50 €",
      position:
        "lg:right-[43px] lg:top-[89px] lg:rotate-[16deg] min-[1600px]:right-0 min-[1600px]:top-[119px]",
    },
  ];
  return (
    <div className="relative mx-auto h-[390px] w-full max-w-[654px] sm:h-[500px] lg:h-[543px] min-[1600px]:h-[724px] min-[1600px]:max-w-[872px]">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`absolute aspect-[9/16] w-[min(39vw,228.8px)] overflow-hidden rounded-[20.8px] border min-[1600px]:w-[305px] min-[1600px]:rounded-[28px] ${index === 1 ? "border-[#d4943a]/40 shadow-[0_0_40px_rgba(212,148,58,.18)]" : "border-white/10"} bg-[#181410] max-lg:!left-1/2 max-lg:!right-auto max-lg:!top-10 ${index === 0 ? "max-lg:-translate-x-[82%] max-lg:-rotate-[14deg]" : index === 1 ? "max-lg:z-10 max-lg:-translate-x-1/2" : "max-lg:-translate-x-[18%] max-lg:rotate-[14deg]"} ${card.position}`}
        >
          <Image
            src={card.src}
            alt={card.title}
            fill
            sizes="(min-width: 1600px) 305px, 229px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/35" />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[7px] min-[1600px]:inset-x-4 min-[1600px]:top-4 min-[1600px]:text-[10px]">
            <span className="rounded-[5px] border border-white/20 bg-black/35 p-1">
              ←
            </span>
            <b>BISTRO NUBE</b>
            <span className="rounded-[5px] border border-white/20 bg-black/35 px-1.5 py-1">
              EN
            </span>
          </div>
          <div className="absolute inset-x-3 bottom-4 min-[1600px]:inset-x-4 min-[1600px]:bottom-5">
            <div className="flex items-end justify-between gap-2">
              <b className="max-w-[70%] text-[10px] leading-3 sm:text-xs sm:leading-4 min-[1600px]:text-[16px] min-[1600px]:leading-5">
                {card.title}
              </b>
              <b className="text-[9px] text-[#fcd34d] sm:text-[10px] min-[1600px]:text-[14px]">
                {card.price}
              </b>
            </div>
            <p className="mt-1 text-[7px] text-white/60 min-[1600px]:text-[10px]">
              Descripción
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  visual,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="h-[208.87px] rounded-[16px] border border-[#2a2a2a] bg-[#1a1a1a] p-[12.8px]">
      <div className="flex h-28 items-center justify-center text-[#d4943a]">
        {visual}
      </div>
      <div className="pt-3">
        <span className="hidden">{icon}</span>
        <h3 className="text-[13px] font-bold leading-[19.5px] text-[#f5f0eb]">
          {title}
        </h3>
      </div>
      <p className="pt-1 text-[11px] leading-[17.88px] text-[#a09890]">
        {text}
      </p>
    </article>
  );
}
function ProcessStep({
  number,
  title,
  text,
  children,
}: {
  number: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <article className="border-t border-[#2a2a2a] pt-4 first:border-t-0">
      <span className="text-[11px] font-bold leading-[16.5px] tracking-[1.1px] text-[#d4a853]">
        {number}
      </span>
      <h3 className="pt-4 font-[family-name:var(--font-marketing-sans)] text-[20px] font-bold leading-7">
        {title}
      </h3>
      <p className="pt-4 text-[14px] leading-[22.75px] text-[#a09890]">
        {text}
      </p>
      <div className="pb-12 pt-5">{children}</div>
    </article>
  );
}
function WindowFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="flex h-8 items-center gap-1.5 border-b border-white/[.06] px-3">
        <span className="size-1.5 rounded-full bg-[#f0643a]" />
        <span className="size-1.5 rounded-full bg-[#d4943a]" />
        <span className="size-1.5 rounded-full bg-[#6e9f75]" />
        <span className="ml-2 text-[8px] text-[#77716b]">panel.menuly.es</span>
      </div>
      {children}
    </div>
  );
}
function SettingsMockup() {
  return (
    <WindowFrame>
      <div className="grid h-[187px] gap-2 p-4 text-[9px]">
        <span className="text-[#77716b]">Nombre del restaurante</span>
        <div className="rounded-[6px] border border-white/[.08] bg-[#111] p-2">
          Casa Marcelo
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[6px] border border-white/[.08] bg-[#111] p-2">
            Español
          </div>
          <div className="rounded-[6px] border border-[#d4943a]/40 bg-[#111] p-2 text-[#d4943a]">
            Moderno
          </div>
        </div>
        <div className="flex items-center justify-between text-[#77716b]">
          <span>Traducción automática</span>
          <i className="h-3 w-6 rounded-full bg-[#d4943a]" />
        </div>
      </div>
    </WindowFrame>
  );
}
function MenuMockup() {
  return (
    <WindowFrame>
      <div className="h-[225px] space-y-2 p-4 text-[9px]">
        {[
          ["Tartar de atún", "€14"],
          ["Chuletón madurado", "€38"],
          ["Burrata con trufa", "€16"],
        ].map(([name, price]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-[6px] bg-[#111] p-2"
          >
            <span className="flex items-center gap-2">
              <i className="size-4 rounded-full bg-[#353432]" />
              {name}
            </span>
            <b className="text-[#d4943a]">{price}</b>
          </div>
        ))}
        <p className="text-center text-[#77716b]">+ Añadir plato</p>
      </div>
    </WindowFrame>
  );
}
function QrMockup() {
  return (
    <WindowFrame>
      <div className="grid h-[222px] place-items-center p-5">
        <QrCode size={80} className="text-white" />
        <p className="text-[9px] text-[#f5f0eb]">Tu carta está publicada</p>
        <p className="text-[8px] text-[#d4943a]">menuly.es/r/casa-marcelo</p>
        <span className="w-full rounded-[20px] bg-[#d4943a] px-5 py-2 text-center text-[8px] font-bold text-[#111]">
          Descargar QR
        </span>
      </div>
    </WindowFrame>
  );
}
function PriceCard({
  name,
  price,
  suffix,
  note,
  description,
  features,
  href,
  cta,
  featured = false,
}: {
  name: string;
  price: string;
  suffix: string;
  note?: string;
  description: string;
  features: readonly string[];
  href: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`relative flex h-[400.6px] flex-col rounded-[16px] border bg-[#1a1a1a] p-[20.8px] ${featured ? "border-[#d4a853] shadow-[0_0_30px_rgba(212,168,83,.08)]" : "border-[#2a2a2a]"}`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[20px] bg-[#d4a853] px-3 py-1 text-[9px] font-bold text-[#111]">
          Recomendado
        </span>
      )}
      <p className="text-[12px] font-semibold leading-4 text-[#a09890]">
        {name}
      </p>
      <div className="mt-1">
        <strong className="font-[family-name:var(--font-marketing-sans)] text-[30px] font-extrabold leading-9 tracking-[-.75px]">
          {price}
        </strong>
        <span className="ml-1 text-[10px] text-[#77716b]">{suffix}</span>
      </div>
      {note && (
        <p className="mt-1 text-[9px] font-semibold text-[#d4943a]">{note}</p>
      )}
      <p className="mt-2 min-h-10 text-[10px] leading-4 text-[#a09890]">
        {description}
      </p>
      <ul className="mt-3 flex-1 space-y-2 text-[10px] leading-4">
        {features.map((item) => (
          <li key={item} className="flex gap-2">
            <Check size={12} className="mt-0.5 shrink-0 text-[#d4943a]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-4 rounded-[32px] px-4 py-3 text-center text-[11px] font-bold transition ${featured ? "bg-[#d4943a] text-[#111] hover:bg-[#e3a64d]" : "border border-white/10 text-[#a09890] hover:border-[#d4943a] hover:text-white"}`}
      >
        {cta}
      </Link>
    </article>
  );
}
