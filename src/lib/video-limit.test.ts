// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, checkVideoLimit, isVideoFile } from "./video-limit";

function videoFile(size: number): File {
  return new File(new Array((size % 256) + 1).fill(new Uint8Array(1024).buffer), "video.mp4", {
    type: "video/mp4",
  });
}

function videoOfSize(bytes: number): File {
  return new File([new Uint8Array(Math.min(bytes, 1024 * 1024))], "video.mp4", {
    type: "video/mp4",
  });
}

// jsdom não cria File de tamanho arbitrário pelo construtor sem o corpo correspondente; o teste
// de tamanho usa Object.defineProperty para declarar o tamanho sem alocar.
function withSize(file: File, bytes: number): File {
  Object.defineProperty(file, "size", { value: bytes });
  return file;
}

afterEach(() => {
  // readDurationSeconds cria <video> que o jsdom não decodifica: cada promise resolve por onerror.
});

describe("isVideoFile", () => {
  it("recognizes video mime types", () => {
    expect(isVideoFile(new File([], "a.mp4", { type: "video/mp4" }))).toBe(true);
    expect(isVideoFile(new File([], "a.webm", { type: "video/webm" }))).toBe(true);
  });

  it("does not treat images as video", () => {
    expect(isVideoFile(new File([], "a.png", { type: "image/png" }))).toBe(false);
  });
});

describe("checkVideoLimit", () => {
  it("accepts a small video", async () => {
    const result = await checkVideoLimit(withSize(videoFile(1), 1024));
    expect(result).toEqual({ ok: true });
  });

  it("rejects a video above 10MB before any upload", async () => {
    const result = await checkVideoLimit(withSize(videoOfSize(1), MAX_VIDEO_BYTES + 1));
    expect(result).toMatchObject({ ok: false, reason: "size" });
  });

  it("accepts a video exactly at 10MB when the duration cannot be read locally", async () => {
    // jsdom não decodifica o contêiner: duração desconhecida não recusa (quem decide é o servidor).
    const result = await checkVideoLimit(withSize(videoOfSize(1), MAX_VIDEO_BYTES));
    expect(result).toEqual({ ok: true });
  });

  it("exposes the same limits as the server", () => {
    expect(MAX_VIDEO_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_VIDEO_SECONDS).toBe(180);
  });

  it("rejects a video longer than three minutes when the browser can read the duration", async () => {
    const file = withSize(videoFile(1), 1024);
    const url = URL.createObjectURL(file);
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreate(tag);
      if (tag === "video") {
        const video = element as HTMLVideoElement;
        Object.defineProperty(video, "duration", { value: 200 });
        setTimeout(() => video.onloadedmetadata?.({} as Event), 0);
      }
      return element;
    });
    try {
      const result = await checkVideoLimit(file);
      expect(result).toMatchObject({ ok: false, reason: "duration", maxSeconds: 180 });
    } finally {
      vi.restoreAllMocks();
      URL.revokeObjectURL(url);
    }
  });

  it("accepts a video at exactly three minutes", async () => {
    const file = withSize(videoFile(1), 1024);
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = originalCreate(tag);
      if (tag === "video") {
        const video = element as HTMLVideoElement;
        Object.defineProperty(video, "duration", { value: 180 });
        setTimeout(() => video.onloadedmetadata?.({} as Event), 0);
      }
      return element;
    });
    try {
      const result = await checkVideoLimit(file);
      expect(result).toEqual({ ok: true });
    } finally {
      vi.restoreAllMocks();
    }
  });
});
