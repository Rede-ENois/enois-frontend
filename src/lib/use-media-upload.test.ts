import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { mediaFileKey, uploadError } from "./use-media-upload";

describe("mediaFileKey", () => {
  it("deriva a mesma chave estável para o mesmo arquivo", () => {
    const file = new File(["foto"], "foto.png", { type: "image/png" });
    expect(mediaFileKey(file)).toBe(mediaFileKey(file));
  });

  it("deriva chaves distintas para arquivos diferentes", () => {
    const a = new File(["a"], "a.png", { type: "image/png" });
    const b = new File(["b"], "b.png", { type: "image/png" });
    expect(mediaFileKey(a)).not.toBe(mediaFileKey(b));
  });
});

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

  it("explica quando o serviço de moderação de imagem está indisponível sem bloquear o envio", () => {
    const err = uploadError(
      new ApiError(503, "IMAGE_MODERATION_UNAVAILABLE", "raw", "/storage/key"),
    );
    expect(err).toMatchObject({
      code: "IMAGE_MODERATION_UNAVAILABLE",
      message: texts.errors.knownCodes.IMAGE_MODERATION_UNAVAILABLE,
    });
  });
});

describe("uploadError — falhas do servidor no envio de arquivo", () => {
  // O texto técnico do servidor não pode chegar à tela em nenhum destes códigos.
  const MENSAGEM_TECNICA = "Erro interno inesperado ao enviar para o bucket de midia.";

  it.each([
    ["MEDIA_TOO_LARGE", 413],
    ["MEDIA_SIZE_MISMATCH", 400],
    ["MEDIA_UPLOAD_FAILED", 400],
    ["MEDIA_UPLOAD_UNAVAILABLE", 503],
    ["MEDIA_STORAGE_WRITE_FAILED", 502],
    ["MEDIA_STORAGE_DISABLED", 503],
  ] as const)("troca a mensagem técnica de %s por texto do app", (code, status) => {
    const err = uploadError(new ApiError(status, code, MENSAGEM_TECNICA)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
    // Afirma o conteúdo, não a própria fonte: um texto vazio ou trocado pela mensagem do servidor
    // falha aqui.
    expect(err.message.length).toBeGreaterThan(20);
    expect(err.message).not.toContain(MENSAGEM_TECNICA);
    expect(err.message).not.toContain("bucket");
  });

  it("não promete um limite de envio quando o arquivo passou, só não deu para processar", () => {
    const err = uploadError(new ApiError(413, "MEDIA_TOO_LARGE", MENSAGEM_TECNICA)) as Error;
    expect(err.message).toContain("processar");
  });

  it("mantém o código que ainda não tem texto próprio", () => {
    const original = new ApiError(403, "MEDIA_FORBIDDEN", "Esta midia nao e sua.");
    expect(uploadError(original)).toBe(original);
  });
});
