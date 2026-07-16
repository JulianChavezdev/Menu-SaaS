import { activeRestaurant } from "@/lib/permissions";
import { QrCard } from "@/components/dashboard/qr-card";
import { BackButton } from "@/components/ui/back-button";

export default async function Page() {
  const { restaurant } = await activeRestaurant();
  const root = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-6 animate-in fade-in duration-300">
      {/* Cabecera Fija */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-0.5">
          <BackButton fallback="/dashboard" />
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Código QR
          </h1>
          <p className="text-xs text-slate-400">
            Descarga e imprime el código QR para colocarlo en las mesas de tu restaurante.
          </p>
        </div>
      </div>

      {/* Tarjeta Bento del QR */}
      <div className="mt-8 max-w-xl rounded-xl border border-slate-800 bg-slate-950/40 p-6 md:p-8 shadow-xl backdrop-blur-sm ring-1 ring-white/5 flex flex-col">
        {/* Encabezado interno */}
        <div className="mb-6 pb-2 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-200">
            Acceso directo a la carta
          </h2>
          <p className="text-[11px] text-slate-500">
            Tus clientes solo tendrán que escanear este código con su móvil para ver los platos en vídeo al instante.
          </p>
        </div>

        {/* Renderizado del componente QR */}
        <div className="w-full flex justify-center">
          <QrCard url={`${root}/r/${restaurant.slug}`} />
        </div>
      </div>
    </main>
  );
}