type PlaybackOptions = {
  isActive: () => boolean;
  muted: () => boolean;
  onPlaying: () => void;
  onBlocked: () => void;
  onError: () => void;
  onMutedFallback: () => void;
};

// Readiness, gestures and recovery share one pending request per element.
// Late promises cannot restart or mark a departed slide as playing.
export function createVideoPlayback(video: HTMLVideoElement, options: PlaybackOptions) {
  let disposed = false;
  let generation = 0;
  let pending = false;
  let retries = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const current = () => !disposed && video.isConnected && options.isActive();
  const clearRetry = () => { clearTimeout(timer); timer = undefined; };
  const playing = () => {
    if (!current()) { video.pause(); return; }
    if (video.paused || video.readyState < 2) return;
    retries = 0;
    clearRetry();
    options.onPlaying();
  };
  const play = () => {
    if (!current() || pending) return;
    clearRetry();
    video.muted = options.muted();
    if (!video.paused) { playing(); return; }
    const request = ++generation;
    pending = true;
    void video.play().then(() => {
      if (request === generation && current()) playing();
    }).catch((error: unknown) => {
      if (request !== generation || !current()) return;
      const name = (error as DOMException)?.name;
      if (name === "NotAllowedError" && !video.muted) {
        video.muted = true;
        video.defaultMuted = true;
        options.onMutedFallback();
        timer = setTimeout(play, 0);
      } else if (name === "AbortError" && retries < 3) {
        retries += 1;
        timer = setTimeout(play, 150);
      } else if (name === "NotAllowedError") {
        options.onBlocked();
      } else if (name === "NotSupportedError" || video.error) {
        options.onError();
      }
    }).finally(() => { if (request === generation) pending = false; });
  };
  const pause = () => {
    generation += 1;
    pending = false;
    clearRetry();
    video.pause();
  };
  video.addEventListener("playing", playing);
  return {
    play, pause,
    dispose: () => { disposed = true; pause(); video.removeEventListener("playing", playing); },
  };
}
