import Link from "next/link";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-violet-500/30">

      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-[150px]" />

      <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
      
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1 text-xs font-semibold tracking-wider text-pink-300 uppercase">
            ⚡ Carta Video
          </div>
          
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            La carta que hace que tus platos hablen.
          </h1>
          
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Transforma el menú de tu restaurante en una experiencia visual irresistible. El primer SaaS multi-restaurante de cartas digitales en vídeo, diseñado para redefinir la hostelería.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <Link 
              className="rounded-xl bg-violet-600 px-6 py-3.5 font-medium text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50" 
              href="/r/bistro-nube"
            >
              Ver demo interactiva
            </Link>
            <Link 
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3.5 font-medium text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-slate-500 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50" 
              href="/login"
            >
              Acceder al panel
            </Link>
          </div>
        </div>


        <div className="relative flex justify-center lg:col-span-5">
          <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[2.5rem] border-4 border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
            {/* Notch superior del teléfono */}
            <div className="absolute top-0 left-1/2 h-4 w-32 -translate-x-1/2 rounded-b-xl bg-slate-800 z-30" />
            
            {/* Pantalla interna simulada */}
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-slate-900 flex flex-col justify-end px-5 pb-6 pt-4">
              {/* Etiqueta de vídeo nativa integrada */}
              <video
                className="absolute inset-0 h-full w-full object-cover z-0"
                autoPlay
                muted
                loop
                playsInline
                src="https://res.cloudinary.com/det6jfwzx/video/upload/v1783700256/Generame_un_video_de_una_hambu_oo9gur.mp4" 
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
              
              {/* Iluminación estética sutil */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent z-10 pointer-events-none" />
              
              {/* UI simulada sobre el video */}
              <div className="relative z-20 space-y-2 transform translate-y-0">
                <span className="rounded bg-pink-500/20 border border-pink-500/40 px-2 py-0.5 text-[10px] font-bold text-pink-300 uppercase tracking-wider w-max block">
                  Sugerencia del chef
                </span>
                <h3 className="text-lg font-bold text-white">CheeseBurger</h3>
                <p className="text-xs text-slate-300 line-clamp-2">
                  Bacon madurado, Cebolla crujiente y Brioche de la casa
                </p>
                <div className="pt-3 flex justify-between items-center border-t border-white/10">
                  <span className="text-sm font-extrabold text-violet-400">18,50€</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {/* Espacio libre para estados de reproducción */}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
         
          <div className="absolute -bottom-4 -left-4 -z-10 h-24 w-24 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 opacity-20 blur-sm rotate-12" />
        </div>
      </div>
    </main>
  );
}