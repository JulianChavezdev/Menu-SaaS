"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff, LoaderCircle, Play, RefreshCcw } from "lucide-react";
import { menuVideoPlaybackUrl } from "@/lib/menu-media";
import { createVideoPlayback } from "@/lib/video-playback";

type Props = {
  index: number; name: string; src: string | null; poster: string | null;
  muted: boolean; preload: "none" | "metadata" | "auto"; active: boolean; hydrated: boolean;
  setVideoRef: (element: HTMLVideoElement | null) => void;
  onPlaybackStarted: (index: number) => void;
  onMutedFallback: () => void;
};

export function ProductMedia(props: Props) {
  const { index, name, src, poster, muted, preload, active, hydrated } = props;
  const playbackSrc = menuVideoPlaybackUrl(src);
  const latest = useRef(props);
  latest.current = props;
  const localRef = useRef<HTMLVideoElement | null>(null);
  const controller = useRef<ReturnType<typeof createVideoPlayback> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(src ? "loading" : "ready");
  const [autoBlocked, setAutoBlocked] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const assign = useCallback((element: HTMLVideoElement | null) => {
    localRef.current = element;
    if (element) {
      element.muted = latest.current.muted;
      element.defaultMuted = latest.current.muted;
      element.setAttribute("playsinline", "");
      element.setAttribute("webkit-playsinline", "true");
    }
    latest.current.setVideoRef(element);
  }, []);

  useEffect(() => {
    setStatus(src ? "loading" : "ready");
    setAutoBlocked(false);
    setBuffering(false);
    const video = localRef.current;
    if (!video || !hydrated || !src) return;
    const playback = createVideoPlayback(video, {
      isActive: () => latest.current.active && document.visibilityState !== "hidden",
      muted: () => latest.current.muted,
      onPlaying: () => {
        setStatus("ready"); setBuffering(false); setAutoBlocked(false);
        latest.current.onPlaybackStarted(latest.current.index);
      },
      onBlocked: () => { setAutoBlocked(true); setBuffering(false); },
      onError: () => setStatus("error"),
      onMutedFallback: () => latest.current.onMutedFallback(),
    });
    controller.current = playback;
    const synchronize = () => {
      if (video.error) { setStatus("error"); return; }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setStatus("ready");
      playback.play();
    };
    const resume = () => {
      if (!latest.current.active || document.visibilityState === "hidden") return;
      // Reload only failed sources. Reloading a healthy pending request
      // discards its buffer and aborts Safari's initial autoplay.
      if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
      synchronize();
    };
    video.addEventListener("menuly:resume", resume);
    video.addEventListener("loadeddata", synchronize);
    video.addEventListener("canplay", synchronize);
    synchronize();
    return () => {
      playback.dispose(); controller.current = null;
      video.removeEventListener("menuly:resume", resume);
      video.removeEventListener("loadeddata", synchronize);
      video.removeEventListener("canplay", synchronize);
    };
  }, [hydrated, src]);

  useEffect(() => {
    if (active) controller.current?.play();
    else { controller.current?.pause(); setBuffering(false); setAutoBlocked(false); }
  }, [active, hydrated, muted, src]);

  useEffect(() => {
    if (!active || !hydrated || !src) return;
    const recovery = setInterval(() => controller.current?.play(), 1500);
    return () => clearInterval(recovery);
  }, [active, hydrated, src]);

  const retry = () => {
    const video = localRef.current;
    if (!video) return;
    controller.current?.pause();
    setStatus("loading"); setAutoBlocked(false);
    video.load(); controller.current?.play();
  };
  const manualPlay = () => controller.current?.play();
  const fallbackStyle = {
    backgroundImage: poster ? `linear-gradient(rgba(6,8,18,.12),rgba(6,8,18,.45)),url(${poster})` : "linear-gradient(#22221f,#111111)",
  };

  return <div className="relative h-full w-full overflow-hidden bg-slate-950">
    <div aria-hidden="true" style={fallbackStyle} className="absolute inset-0 bg-cover bg-center" />
    {src && hydrated && <video
      data-video-index={index} ref={assign} src={playbackSrc ?? undefined}
      poster={poster ?? undefined} autoPlay={active} muted={muted} loop playsInline
      preload={preload} disablePictureInPicture
      onLoadStart={() => setStatus("loading")}
      onWaiting={() => setBuffering(true)} onStalled={() => setBuffering(true)}
      onError={() => setStatus("error")}
      className={`relative h-full w-full object-cover ${status === "error" ? "opacity-0" : "opacity-100"}`}
    />}
    {src && hydrated && active && !autoBlocked && (status === "loading" || buffering) &&
      <div role="status" aria-label={`Cargando vídeo de ${name}`} className="pointer-events-none absolute right-4 top-1/2 rounded-full bg-black/30 p-2 text-white/80">
        <LoaderCircle className="animate-spin" size={16} />
      </div>}
    {src && hydrated && status === "error" && <div className="absolute inset-0 grid place-items-center bg-black/30 p-6 text-center">
      <div><ImageOff className="mx-auto" size={22} /><p className="mt-3 text-sm font-semibold">El vídeo no está disponible</p>
        <p className="mt-1 text-xs text-white/80">Puedes seguir consultando el plato.</p>
        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold"><RefreshCcw size={14} />Reintentar</button>
      </div>
    </div>}
    {src && hydrated && active && autoBlocked && status !== "error" &&
      <button type="button" onClick={manualPlay} aria-label={`Reproducir vídeo de ${name}`} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45"><Play className="ml-1" fill="currentColor" size={23} /></button>}
  </div>;
}
