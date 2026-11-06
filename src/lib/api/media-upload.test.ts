// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mediaApi } from "./media";

class FakeUploadXHR {
  static instances: FakeUploadXHR[] = [];
  static last: FakeUploadXHR | null = null;
  open = vi.fn();
  withCredentials = false;
  responseType = "";
  status = 0;
  responseText = "";
  upload: {
    onprogress:
      ((event: { lengthComputable?: boolean; total?: number; loaded?: number }) => void) | null;
  } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeUploadXHR.instances.push(this);
    FakeUploadXHR.last = this;
  }
}

describe("mediaApi.uploadToSignedUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("XMLHttpRequest", FakeUploadXHR);
    FakeUploadXHR.instances = [];
    FakeUploadXHR.last = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the file with the signed headers and resolves when the server stores it", async () => {
    const onProgress = vi.fn();
    const promise = mediaApi.uploadToSignedUrl(
      "https://cdn.example.com/media/media_1/file.png",
      new File(["abc"], "file.png", { type: "image/png" }),
      { "Content-Type": "image/png" },
      onProgress,
    );

    const xhr = FakeUploadXHR.last;
    expect(xhr).not.toBeNull();
    expect(xhr?.open).toHaveBeenCalledWith("PUT", "https://cdn.example.com/media/media_1/file.png");
    expect(xhr?.setRequestHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(xhr?.send).toHaveBeenCalledTimes(1);

    xhr?.upload.onprogress?.({ lengthComputable: true, total: 4, loaded: 2 });
    expect(onProgress).toHaveBeenCalledWith(50);

    xhr!.status = 200;
    xhr!.responseText = "";
    xhr!.onload?.();
    await expect(promise).resolves.toBeUndefined();
  });

  it("reports real rounded progress and skips indeterminate events", async () => {
    const onProgress = vi.fn();
    const promise = mediaApi.uploadToSignedUrl(
      "https://cdn.example.com/media/media_1/file.png",
      new File(["abc"], "file.png", { type: "image/png" }),
      {},
      onProgress,
    );

    const xhr = FakeUploadXHR.last;
    xhr?.upload.onprogress?.({ lengthComputable: true, total: 3, loaded: 1 });
    expect(onProgress).toHaveBeenCalledWith(33);

    xhr?.upload.onprogress?.({ lengthComputable: false });
    expect(onProgress).toHaveBeenCalledTimes(1);

    xhr!.status = 200;
    xhr!.responseText = "";
    xhr!.onload?.();
    await promise;
  });

  it("rejects when the upload fails", async () => {
    const promise = mediaApi.uploadToSignedUrl(
      "https://cdn.example.com/media/media_1/file.png",
      new File(["abc"], "file.png", { type: "image/png" }),
      {},
    );

    const xhr = FakeUploadXHR.last;
    xhr!.status = 500;
    xhr!.responseText = "erro";
    xhr!.onload?.();

    await expect(promise).rejects.toThrow("Upload falhou: 500");
  });

  it("rejects when the upload is cancelled through the abort signal", async () => {
    const controller = new AbortController();
    const promise = mediaApi.uploadToSignedUrl(
      "https://cdn.example.com/media/media_1/file.png",
      new File(["abc"], "file.png", { type: "image/png" }),
      {},
      undefined,
      controller.signal,
    );

    const xhr = FakeUploadXHR.last;
    controller.abort();
    expect(xhr?.abort).toHaveBeenCalled();
    xhr!.onabort?.();

    await expect(promise).rejects.toThrow("Upload cancelado.");
  });
});
