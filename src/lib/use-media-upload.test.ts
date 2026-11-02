import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { uploadError } from "./use-media-upload";

describe("uploadError", () => {
  it("explains a file type the purpose does not take", () => {
    const err = uploadError(new ApiError(400, "MEDIA_TYPE_NOT_ALLOWED", "x", "/media/uploads"));
    expect(err).toMatchObject({
      code: "MEDIA_TYPE_NOT_ALLOWED",
      message: texts.errors.knownCodes.MEDIA_TYPE_NOT_ALLOWED,
    });
  });

  it("leaves other errors untouched", () => {
    const original = new Error("boom");
    expect(uploadError(original)).toBe(original);
  });

  it("shows a clear message when image moderation rejects an upload", () => {
    const err = uploadError(new ApiError(422, "IMAGE_CONTENT_NOT_ALLOWED", "raw", "/storage/key"));
    expect(err).toMatchObject({
      code: "IMAGE_CONTENT_NOT_ALLOWED",
      message: texts.errors.knownCodes.IMAGE_CONTENT_NOT_ALLOWED,
    });
  });

  it("explains when image moderation cannot verify the file", () => {
    const err = uploadError(new ApiError(422, "IMAGE_CANNOT_BE_VERIFIED", "raw", "/storage/key"));
    expect(err).toMatchObject({
      code: "IMAGE_CANNOT_BE_VERIFIED",
      message: texts.errors.knownCodes.IMAGE_CANNOT_BE_VERIFIED,
    });
  });
});
