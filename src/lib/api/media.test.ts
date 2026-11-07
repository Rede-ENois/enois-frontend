import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { mediaUploadResponseError, resolveCdnUrl } from "./media";

describe("resolveCdnUrl", () => {
  it("keeps the dev local storage path on the app's own origin", () => {
    expect(resolveCdnUrl("/api/storage/uploads/media_1/file.png")).toBe(
      "/api/storage/uploads/media_1/file.png",
    );
    expect(resolveCdnUrl("/storage/uploads/media_1/file.png")).toBe(
      "/storage/uploads/media_1/file.png",
    );
  });

  it("still sends legacy relative paths to the ImageKit endpoint", () => {
    expect(resolveCdnUrl("/destaque/foto.png")).toMatch(/^https?:\/\/.+\/destaque\/foto\.png$/);
  });

  it("keeps absolute URLs untouched", () => {
    expect(resolveCdnUrl("https://cdn.example.com/foto.png")).toBe(
      "https://cdn.example.com/foto.png",
    );
  });
});

describe("mediaUploadResponseError", () => {
  it("preserves the API code and maps the moderation message", () => {
    const error = mediaUploadResponseError(
      422,
      JSON.stringify({ code: "IMAGE_CONTENT_NOT_ALLOWED", message: "raw" }),
      "/storage/uploads/media_example/file.jpg",
    );

    expect(error).toMatchObject({
      status: 422,
      code: "IMAGE_CONTENT_NOT_ALLOWED",
      path: "/storage/uploads/media_example/file.jpg",
      message: texts.errors.knownCodes.IMAGE_CONTENT_NOT_ALLOWED,
    });
  });

  it("uses the backend message for an unrecognized code", () => {
    const error = mediaUploadResponseError(
      422,
      JSON.stringify({ code: "NEW_MEDIA_ERROR", message: "Tente novamente." }),
      "/storage/key",
    );

    expect(error.message).toBe("Tente novamente.");
    expect(error.code).toBe("NEW_MEDIA_ERROR");
  });

  it("keeps an HTTP fallback when the proxy body is not JSON", () => {
    const error = mediaUploadResponseError(503, "temporarily unavailable", "/storage/key");

    expect(error).toMatchObject({
      status: 503,
      path: "/storage/key",
      message: "Upload falhou: 503",
    });
  });
});
