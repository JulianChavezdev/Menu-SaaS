"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { assignCloudinaryVideo, assignMedia } from "@/app/dashboard/actions";
import { uploadVideoResumable } from "@/lib/resumable-video-upload";
import {
  CloudinaryUnavailableError,
  uploadCloudinaryVideo,
} from "@/lib/cloudinary-video-upload";
import { toast } from "sonner";
import { createVideoPoster } from "@/lib/video-poster";

type Option = {
  id: string;
  name: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
};
type Kind = "product-video" | "product-image" | "logo";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function MediaUpload({
  restaurantId,
  kind = "logo",
  products = [],
  label,
  currentUrl,
}: {
  restaurantId: string;
  kind?: Kind;
  products?: Option[];
  label?: string;
  currentUrl?: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState<{
    duration: number;
    width: number;
    height: number;
  } | null>(null);
  const [productId, setProductId] = useState("");
  const video = kind === "product-video";
  const productMedia = kind === "product-video" || kind === "product-image";
  const title =
    label ??
    (video
      ? "Vídeo del producto"
      : kind === "product-image"
        ? "Foto del producto"
        : "Logo");
  const maxBytes = video ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function choose(candidate: File) {
    const valid = video ? VIDEO_TYPES : IMAGE_TYPES;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    const validExtension = video
      ? ["mp4", "webm", "mov"].includes(extension ?? "")
      : ["jpg", "jpeg", "png", "webp"].includes(extension ?? "");
    if (!valid.includes(candidate.type) && !validExtension) {
      toast.error("Formato de archivo no válido.");
      return;
    }
    if (candidate.size > maxBytes) {
      toast.error(`El archivo supera el máximo de ${video ? 50 : 5} MB.`);
      return;
    }
    setVideoInfo(null);
    setProgress(0);
    setFile(candidate);
  }

  async function upload() {
    if (!file) return;
    if (productMedia && !productId) {
      toast.error("Selecciona primero un producto.");
      return;
    }
    setUploading(true);
    setProgress(0);
    const supabase = createClient();
    let uploadedPath = "";
    let posterPath = "";
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      uploadedPath = video
        ? `restaurants/${restaurantId}/products/${productId}/video-${crypto.randomUUID()}.${ext}`
        : kind === "product-image"
          ? `restaurants/${restaurantId}/products/${productId}/image-${crypto.randomUUID()}.${ext}`
          : `restaurants/${restaurantId}/branding/logo-${crypto.randomUUID()}.${ext}`;
      if (video) {
        try {
          const result = await uploadCloudinaryVideo({
            file,
            restaurantId,
            productId,
            onProgress: setProgress,
          });
          await assignCloudinaryVideo(productId, result.publicId);
          toast.success(`${title} optimizado y actualizado`);
          setFile(null);
          setProgress(0);
          setVideoInfo(null);
          router.refresh();
          return;
        } catch (error) {
          if (!(error instanceof CloudinaryUnavailableError)) throw error;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session)
          throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
        const poster = await createVideoPoster(file);
        posterPath = `restaurants/${restaurantId}/products/${productId}/image-auto-${crypto.randomUUID()}.jpg`;
        const { error: posterError } = await supabase.storage
          .from("restaurant-media")
          .upload(posterPath, poster, {
            upsert: false,
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });
        if (posterError) throw posterError;
        await uploadVideoResumable({
          file,
          path: uploadedPath,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          accessToken: session.access_token,
          onProgress: setProgress,
        });
      } else {
        const { error } = await supabase.storage
          .from("restaurant-media")
          .upload(uploadedPath, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: "31536000",
          });
        if (error) throw error;
      }
      await assignMedia(
        kind,
        uploadedPath,
        productMedia ? productId : undefined,
        posterPath || undefined,
      );
      toast.success(`${title} actualizado`);
      setFile(null);
      setProgress(0);
      setVideoInfo(null);
      router.refresh();
    } catch (error) {
      if (uploadedPath || posterPath)
        await supabase.storage
          .from("restaurant-media")
          .remove([uploadedPath, posterPath].filter(Boolean));
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir el archivo",
      );
    } finally {
      setUploading(false);
    }
  }

  const selectedProduct = productMedia
    ? products.find((product) => product.id === productId)
    : undefined;
  const savedUrl = productMedia
    ? video
      ? selectedProduct?.videoUrl
      : selectedProduct?.imageUrl
    : currentUrl;
  const shown = preview || savedUrl;
  return (
    <div className="glass rounded-xl p-4">
      <h2 className="mb-1 font-bold">{title}</h2>
      <p className="mb-3 text-xs text-slate-600">
        {savedUrl
          ? "Archivo actual guardado. Puedes reemplazarlo."
          : "Todavía no hay ningún archivo guardado."}
      </p>
      {productMedia && (
        <select
          aria-label={
            video ? "Producto para el vídeo" : "Producto para la foto"
          }
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="mb-3 w-full rounded-lg p-2 text-slate-900"
        >
          <option value="">Selecciona el producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      )}
      {shown && (
        <div className="mb-3">
          {video ? (
            <video
              src={shown}
              controls
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => {
                if (file) {
                  const media = event.currentTarget;
                  setVideoInfo({
                    duration: media.duration,
                    width: media.videoWidth,
                    height: media.videoHeight,
                  });
                }
              }}
              className="aspect-video w-full rounded-lg bg-black object-contain"
            />
          ) : (
            <div
              role="img"
              aria-label={`Vista previa de ${title}`}
              className="aspect-video rounded-lg bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${shown})` }}
            />
          )}
        </div>
      )}
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const candidate = event.dataTransfer.files[0];
          if (candidate) choose(candidate);
        }}
        className="block cursor-pointer rounded-xl border-2 border-dashed border-stone-300 p-5 text-center hover:bg-stone-100"
      >
        <input
          className="sr-only"
          type="file"
          accept={
            video
              ? "video/mp4,video/webm,video/quicktime"
              : "image/jpeg,image/png,image/webp"
          }
          onChange={(event) => {
            const candidate = event.target.files?.[0];
            if (candidate) choose(candidate);
          }}
        />
        <Upload className="mx-auto mb-2" />
        <span>
          {file
            ? file.name
            : `Seleccionar o arrastrar ${video ? "vídeo" : kind === "product-image" ? "foto" : "logo"}`}
        </span>
        <span className="mt-1 block text-xs text-slate-600">
          Máximo {video ? 50 : 5} MB
        </span>
      </label>
      {video && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Recomendado: MP4 vertical, H.264, menos de 30 segundos y 20 MB para
          una carga rápida.
        </p>
      )}
      {file && videoInfo && (
        <p className="mt-2 text-xs font-medium text-slate-600">
          {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
          {Math.ceil(videoInfo.duration)} s · {videoInfo.width} ×{" "}
          {videoInfo.height}px
          {videoInfo.width > videoInfo.height
            ? " · Mejor en formato vertical"
            : ""}
        </p>
      )}
      {uploading && video && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
            <span>Subida segura reanudable</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-orange-600 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {file && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => void upload()}
            className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {uploading
              ? video
                ? `Subiendo ${progress}%`
                : "Subiendo…"
              : "Confirmar subida"}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              setFile(null);
              setVideoInfo(null);
              setProgress(0);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
