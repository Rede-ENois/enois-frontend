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

describe("uploadError — falhas do servidor no envio de arquivo", () => {
  it.each([
    ["MEDIA_TOO_LARGE", 413],
    ["MEDIA_SIZE_MISMATCH", 400],
    ["MEDIA_UPLOAD_FAILED", 400],
    ["MEDIA_UPLOAD_UNAVAILABLE", 503],
    ["MEDIA_STORAGE_WRITE_FAILED", 502],
  ])("troca a mensagem técnica de %s por texto do app", (code, status) => {
    const err = uploadError(
      new ApiError(status, code, "Arquivo grande demais para a limpeza de metadados."),
    );
    expect(err).toMatchObject({
      code,
      status,
      message: texts.errors.knownCodes[code],
    });
    expect((err as Error).message).not.toContain("metadados");
  });

  it("mantém o código que ainda não tem texto próprio", () => {
    const original = new ApiError(403, "MEDIA_FORBIDDEN", "Esta midia nao e sua.");
    expect(uploadError(original)).toBe(original);
  });
});
