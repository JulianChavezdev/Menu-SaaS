import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

dotenv.config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error("Faltan las credenciales privadas de Supabase.");
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: products, error } = await admin
  .from("products")
  .select("id,restaurant_id,name,video_url,image_url,image_path")
  .not("video_url", "is", null)
  .is("image_url", null);
if (error) throw error;
const pending = (products ?? []).filter((product) => !product.image_path);
let completed = 0;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
for (const product of pending) {
  try {
    await page.setContent(
      '<video muted playsinline style="width:720px;height:1280px;object-fit:cover;background:#111"></video>',
    );
    await page.evaluate(async (source) => {
      const video = document.querySelector("video");
      if (!(video instanceof HTMLVideoElement))
        throw new Error("Vídeo no disponible.");
      video.src = source;
      video.load();
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () =>
          reject(new Error("El navegador no pudo cargar el vídeo."));
      });
      video.currentTime = Math.min(
        0.2,
        Number.isFinite(video.duration) ? video.duration / 4 : 0.2,
      );
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      video.pause();
    }, product.video_url);
    const poster = await page
      .locator("video")
      .screenshot({ type: "jpeg", quality: 82 });
    const path = `restaurants/${product.restaurant_id}/products/${product.id}/image-auto-${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await admin.storage
      .from("restaurant-media")
      .upload(path, poster, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const imageUrl = admin.storage.from("restaurant-media").getPublicUrl(path)
      .data.publicUrl;
    const { error: updateError } = await admin
      .from("products")
      .update({ image_path: path, image_url: imageUrl })
      .eq("id", product.id)
      .is("image_url", null);
    if (updateError) {
      await admin.storage.from("restaurant-media").remove([path]);
      throw updateError;
    }
    completed++;
    console.log(`OK ${product.name}`);
  } catch (error) {
    console.error(
      `ERROR ${product.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
await browser.close();
console.log(`${completed}/${pending.length} miniaturas generadas.`);
if (completed !== pending.length) process.exitCode = 1;
