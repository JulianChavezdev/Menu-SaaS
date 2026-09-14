import { expect, test } from "@playwright/test";
import path from "node:path";

const clip = path.resolve("tests/e2e/fixtures/autoplay.mp4");
const mediaUrl = /https:\/\/(res\.cloudinary\.com|videos\.pexels\.com)\/.*\.mp4(?:\?.*)?$/;
const menuUrl = "/r/bistro-nube?preview=embed";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const load = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function () {
      this.dataset.explicitLoads = String(Number(this.dataset.explicitLoads || 0) + 1);
      load.call(this);
    };
  });
});

test("starts and advances videos without pressing play or reloading healthy buffers", async ({ page }) => {
  await page.route(mediaUrl, route => route.fulfill({ path: clip, contentType: "video/mp4" }));
  await page.goto(menuUrl, { waitUntil: "domcontentloaded" });
  const first = page.locator('video[data-video-index="0"]');
  await expect.poll(() => first.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 }).toBeGreaterThan(0.1);
  expect(await first.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  expect(await first.getAttribute("data-explicit-loads")).toBeNull();
  await expect(page.getByRole("button", { name: /Reproducir vídeo de|Reanudar vídeo/ })).toHaveCount(0);

  const second = page.locator('video[data-video-index="1"]');
  await expect.poll(() => second.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
  await page.locator("main.public-menu").evaluate(element => element.scrollTo({ top: element.clientHeight, behavior: "instant" }));
  await expect.poll(() => second.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
  await expect.poll(() => first.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  expect(await second.getAttribute("data-explicit-loads")).toBeNull();
});

test("prioritizes the initial video and keeps slow downloads free of play prompts", async ({ page, browserName }) => {
  test.skip(browserName === "webkit" && process.platform === "win32", "Windows WebKit media downloads bypass Playwright routing.");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const requests: string[] = [];
  await page.route(mediaUrl, async route => {
    requests.push(route.request().url());
    await gate;
    await route.fulfill({ path: clip, contentType: "video/mp4" });
  });
  try {
    await page.goto(menuUrl, { waitUntil: "domcontentloaded" });
    await expect.poll(() => requests.length).toBe(1);
    await page.waitForTimeout(4500);
    expect(requests).toHaveLength(1);
    await expect(page.getByRole("button", { name: /Reproducir vídeo de|Reanudar vídeo/ })).toHaveCount(0);
    release();
    const first = page.locator('video[data-video-index="0"]');
    await expect.poll(() => first.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
    await expect.poll(() => requests.length).toBeGreaterThan(1);
    expect(await first.getAttribute("data-explicit-loads")).toBeNull();
  } finally { release(); }
});
