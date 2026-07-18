export async function createVideoPoster(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(new Error("No se pudo leer el vídeo para crear la miniatura."));
    });
    const target =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(0.35, video.duration / 4)
        : 0.1;
    if (target > 0)
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () =>
          reject(new Error("No se pudo extraer la miniatura."));
        video.currentTime = target;
      });
    const sourceWidth = video.videoWidth || 720,
      sourceHeight = video.videoHeight || 1280,
      width = Math.min(720, sourceWidth),
      height = Math.max(1, Math.round(sourceHeight * (width / sourceWidth)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) throw new Error("No se pudo crear la miniatura del vídeo.");
    return blob;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
