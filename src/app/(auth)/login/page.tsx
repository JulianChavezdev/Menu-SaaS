"use client";

import { useEffect,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail,setRememberEmail]=useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  useEffect(()=>{const saved=localStorage.getItem("carta-video:login-email");if(saved)setEmail(saved);void createClient().auth.getUser().then(({data})=>{if(data.user)router.replace("/dashboard")})},[router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if(pending)return;
    setPending(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error){setError(error.message);setPending(false)}
    else {if(rememberEmail)localStorage.setItem("carta-video:login-email",email.trim());else localStorage.removeItem("carta-video:login-email");router.replace("/dashboard");router.refresh()}
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-orange-600/30">
      {/* Luces de fondo coherentes con la landing page (Glow Effects) */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-orange-100 blur-[150px]" />

      <form 
        onSubmit={submit}
        autoComplete="on"
        aria-busy={pending}
        className="relative w-full max-w-md rounded-xl border border-stone-300 bg-white p-8 shadow-md   ring-1 ring-stone-200"
      >
        {/* Cabecera del formulario */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-pink-300 uppercase">
            ⚡ Menuly
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
            Accede a tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestiona tus cartas digitales y aumenta tus ventas.
          </p>
        </div>

        {/* Inputs Estilizados */}
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input 
              required 
              id="login-email"
              name="email"
              type="email" 
              autoComplete="username"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="tu@restaurante.com"
              className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
            <PasswordInput 
              id="login-password"
              name="password"
              required 
              autoComplete="current-password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={rememberEmail} onChange={event=>setRememberEmail(event.target.checked)} className="h-4 w-4 accent-orange-600"/><span>Recordar mi correo en este dispositivo</span></label>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Botón de Acción Principal */}
        <button disabled={pending} className="mt-6 w-full rounded-xl bg-orange-600 py-3.5 font-semibold text-white shadow-lg  transition-all duration-200 hover:bg-orange-600  focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-wait disabled:opacity-60">
          {pending?"Accediendo…":"Entrar al panel"}
        </button>

        {/* Links Inferiores */}
        <p className="mt-6 text-center text-xs text-slate-600 space-x-2">
          <span>¿No tienes cuenta?</span>
          <Link className="font-medium text-orange-700 hover:text-orange-700 underline underline-offset-4" href="/register">
            Regístrate
          </Link>
          <span className="text-slate-600">·</span>
          <Link className="font-medium text-slate-600 hover:text-slate-700 underline underline-offset-4" href="/forgot-password">
            Olvidé mi contraseña
          </Link>
        </p>
      </form>
    </main>
  );
}
