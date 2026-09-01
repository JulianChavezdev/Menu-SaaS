const CLOUDINARY_PLAYBACK_TRANSFORMATION =
  "c_limit,w_720/q_auto:eco/vc_h264/f_mp4";

export function menuVideoPlaybackUrl(source: string | null) {
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.hostname !== "res.cloudinary.com") return source;
    url.pathname = url.pathname.replace(
      /\/video\/upload\/(v\d+\/)/,
      `/video/upload/${CLOUDINARY_PLAYBACK_TRANSFORMATION}/$1`,
    );
    return url.toString();
  } catch {
    return source;
  }
}
