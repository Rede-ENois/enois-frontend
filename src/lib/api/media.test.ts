import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { mediaUploadResponseError } from "./media";

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
