// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  VideoCompressionError,
  compressVideo,
  scaledDimensions,
  supportsVideoCompression,
} from "./compress-video";
import { MAX_VIDEO_BYTES } from "./video-limit";

/** Sizes the fake recorder will produce, one per ladder attempt. */
let producedSizes: number[] = [];
let attempts = 0;
let supportsVp8 = true;

function videoOfSize(bytes: number): File {
  const file = new File([new Uint8Array(16)], "clipe.mp4", { type: "video/mp4" });
  Object.defineProperty(file, "size", { value: bytes });
  return file;
}

class FakeRecorder {
  static isTypeSupported = (type: string) => supportsVp8 && type.includes("webm");
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  private listeners = new Map<string, () => void>();
  constructor(
    _stream: unknown,
    public options: { videoBitsPerSecond: number },
  ) {}
  addEventListener(event: string, handler: () => void) {
    this.listeners.set(event, handler);
  }
  removeEventListener(event: string) {
    this.listeners.delete(event);
  }
  start() {
    const size = producedSizes[attempts] ?? 0;
    attempts += 1;
    // O blob precisa ter o tamanho de verdade: o reencode compara `blob.size` com o teto.
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob([new Uint8Array(size)]) });
    });
  }
  stop() {
    queueMicrotask(() => this.listeners.get("stop")?.());
  }
}

beforeEach(() => {
  producedSizes = [];
  attempts = 0;
  supportsVp8 = true;
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("requestAnimationFrame", () => 0);

  Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
    configurable: true,
    value: () => ({ addTrack: vi.fn(), getAudioTracks: () => [] }),
  });

  const originalCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const element = originalCreate(tag);
    if (tag === "video") {
      const video = element as HTMLVideoElement;
      Object.defineProperty(video, "videoWidth", { value: 1920 });
      Object.defineProperty(video, "videoHeight", { value: 1080 });
      // No navegador os metadados chegam pelo `src`; aqui disparamos sozinhos, senão o
      // reencode (que espera os metadados antes do play) trava.
      setTimeout(() => video.dispatchEvent(new Event("loadedmetadata")), 0);
      video.play = () => {
        setTimeout(() => video.dispatchEvent(new Event("ended")), 1);
        return Promise.resolve();
      };
      video.load = () => {};
    }
    if (tag === "canvas") {
      (element as HTMLCanvasElement).getContext = (() => ({
        drawImage: () => {},
      })) as unknown as HTMLCanvasElement["getContext"];
    }
    return element;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;
});

describe("scaledDimensions", () => {
  it("shrinks the long side and keeps the ratio", () => {
    expect(scaledDimensions(1920, 1080, 1280)).toEqual({ width: 1280, height: 720 });
    expect(scaledDimensions(1080, 1920, 1280)).toEqual({ width: 720, height: 1280 });
  });

  it("never enlarges a video that is already small", () => {
    expect(scaledDimensions(640, 480, 1280)).toEqual({ width: 640, height: 480 });
  });

  it("keeps both sides even", () => {
    expect(scaledDimensions(1921, 1081, 1280)).toEqual({ width: 1280, height: 720 });
  });
});

describe("supportsVideoCompression", () => {
  it("is true when the browser can record WebM", () => {
    expect(supportsVideoCompression()).toBe(true);
  });

  it("is false when the browser has no WebM recorder", () => {
    supportsVp8 = false;
    expect(supportsVideoCompression()).toBe(false);
  });
});

describe("compressVideo", () => {
  it("sends a video that already fits untouched", async () => {
    const file = videoOfSize(MAX_VIDEO_BYTES);
    expect(await compressVideo(file)).toBe(file);
    expect(attempts).toBe(0);
  });

  it("returns the first encoding that fits under the limit", async () => {
    producedSizes = [MAX_VIDEO_BYTES * 3, MAX_VIDEO_BYTES - 1];
    const result = await compressVideo(videoOfSize(MAX_VIDEO_BYTES * 5));

    expect(attempts).toBe(2);
    expect(result.size).toBe(MAX_VIDEO_BYTES - 1);
    expect(result.type).toBe("video/webm");
    expect(result.name.endsWith(".webm")).toBe(true);
  });

  it("steps down the ladder until one encoding fits", async () => {
    producedSizes = [MAX_VIDEO_BYTES * 2, MAX_VIDEO_BYTES * 2, MAX_VIDEO_BYTES + 1, 1024];
    const result = await compressVideo(videoOfSize(MAX_VIDEO_BYTES * 9));

    expect(result.size).toBe(1024);
    expect(attempts).toBe(4);
  });

  it("refuses when even the smallest encoding is still too big", async () => {
    producedSizes = new Array(4).fill(MAX_VIDEO_BYTES * 2);
    await expect(compressVideo(videoOfSize(MAX_VIDEO_BYTES * 9))).rejects.toBeInstanceOf(
      VideoCompressionError,
    );
  });

  it("reports progress for every attempt", async () => {
    producedSizes = [MAX_VIDEO_BYTES * 2, 1024];
    const seen: number[] = [];
    await compressVideo(videoOfSize(MAX_VIDEO_BYTES * 9), (progress) => seen.push(progress));

    expect(seen.at(-1)).toBe(100);
    expect(seen.length).toBeGreaterThan(1);
  });
});
