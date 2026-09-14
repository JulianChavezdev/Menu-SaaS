import { afterEach, describe, expect, it, vi } from "vitest";
import { createVideoPlayback } from "../src/lib/video-playback";

function fixture() {
  const video = Object.assign(new EventTarget(), {
    isConnected: true, paused: true, muted: true, defaultMuted: true, readyState: 4, error: null,
    play: vi.fn<() => Promise<void>>(), pause: vi.fn(),
  });
  video.play.mockImplementation(async () => { video.paused = false; });
  video.pause.mockImplementation(() => { video.paused = true; });
  const options = {
    isActive: vi.fn(() => true), muted: vi.fn(() => true),
    onPlaying: vi.fn(), onBlocked: vi.fn(), onError: vi.fn(),
    onMutedFallback: vi.fn(() => { options.muted.mockReturnValue(true); }),
  };
  return { video, options, player: createVideoPlayback(video as unknown as HTMLVideoElement, options) };
}
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
afterEach(() => vi.useRealTimers());

describe("video playback ownership", () => {
  it("starts muted without a user gesture and reports actual playback", async () => {
    const { player, video, options } = fixture();
    video.muted = false;
    player.play(); await settle();
    expect(video.muted).toBe(true);
    expect(video.play).toHaveBeenCalledOnce();
    expect(options.onPlaying).toHaveBeenCalledOnce();
    player.dispose();
  });
  it("shares pending requests across readiness events and retries", async () => {
    const { player, video } = fixture();
    let resolve!: () => void;
    video.play.mockImplementation(() => new Promise<void>(done => { resolve = done; }));
    player.play(); player.play(); player.play();
    expect(video.play).toHaveBeenCalledOnce();
    resolve(); await settle(); player.dispose();
  });
  it("does not report a paused loading element as playing", async () => {
    const { player, video, options } = fixture();
    video.readyState = 0;
    player.play(); await settle();
    expect(options.onPlaying).not.toHaveBeenCalled();
    video.readyState = 3;
    video.dispatchEvent(new Event("playing"));
    expect(options.onPlaying).toHaveBeenCalledOnce();
    player.dispose();
  });
  it("ignores completion of a request after its slide leaves", async () => {
    const { player, video, options } = fixture();
    let resolve!: () => void;
    video.play.mockImplementation(() => new Promise<void>(done => { resolve = done; }));
    player.play(); options.isActive.mockReturnValue(false); player.pause();
    resolve(); await settle();
    video.dispatchEvent(new Event("playing"));
    expect(options.onPlaying).not.toHaveBeenCalled();
    expect(video.paused).toBe(true);
    player.dispose();
  });
  it("recovers an interrupted play request without requiring a click", async () => {
    vi.useFakeTimers();
    const { player, video, options } = fixture();
    video.play.mockRejectedValueOnce(new DOMException("Interrupted", "AbortError"));
    player.play(); await settle(); await vi.advanceTimersByTimeAsync(150);
    expect(video.play).toHaveBeenCalledTimes(2);
    expect(options.onPlaying).toHaveBeenCalledOnce();
    expect(options.onBlocked).not.toHaveBeenCalled();
    player.dispose();
  });
  it("falls back to muted playback when sound is rejected", async () => {
    vi.useFakeTimers();
    const { player, video, options } = fixture();
    options.muted.mockReturnValue(false);
    video.play.mockRejectedValueOnce(new DOMException("Sound blocked", "NotAllowedError"));
    player.play(); await settle(); await vi.runOnlyPendingTimersAsync();
    expect(options.onMutedFallback).toHaveBeenCalledOnce();
    expect(video.muted).toBe(true);
    expect(options.onPlaying).toHaveBeenCalledOnce();
    player.dispose();
  });
  it("only offers manual playback for a browser policy rejection", async () => {
    const { player, video, options } = fixture();
    video.play.mockRejectedValueOnce(new DOMException("Policy", "NotAllowedError"));
    player.play(); await settle();
    expect(options.onBlocked).toHaveBeenCalledOnce();
    expect(options.onError).not.toHaveBeenCalled();
    player.dispose();
  });
  it("cancels scheduled retries when the player is destroyed", async () => {
    vi.useFakeTimers();
    const { player, video } = fixture();
    video.play.mockRejectedValueOnce(new DOMException("Interrupted", "AbortError"));
    player.play(); await settle(); player.dispose(); await vi.runAllTimersAsync();
    expect(video.play).toHaveBeenCalledOnce();
  });
});
