"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallOperationalApp({ name }: { name: "Comandero" | "Cocina" }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    void navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;
    if (!prompt) { setHelpOpen(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        disabled={installed}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm active:scale-95 disabled:opacity-60"
        aria-label={installed ? `${name} instalada` : `Instalar ${name}`}
      >
        <Download size={17} />
        <span className="hidden sm:inline">{installed ? "Instalada" : "Instalar app"}</span>
      </button>

      {helpOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-black/55 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-label={`Instalar ${name}`}>
          <section className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700"><Smartphone size={22} /></span>
              <button type="button" onClick={() => setHelpOpen(false)} className="grid size-10 place-items-center rounded-lg bg-stone-100" aria-label="Cerrar"><X size={19} /></button>
            </div>
            <h2 className="mt-4 text-xl font-black">Instalar Menuly {name}</h2>
            {isIOS ? (
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li className="flex gap-2"><Share className="mt-1 shrink-0" size={17} />1. Pulsa Compartir en Safari.</li>
                <li>2. Elige “Añadir a pantalla de inicio”.</li>
                <li>3. Confirma pulsando “Añadir”.</li>
              </ol>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">Abre esta pantalla en Chrome y vuelve a pulsar “Instalar app”. Si no aparece, usa el menú de Chrome y selecciona “Instalar aplicación”.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
