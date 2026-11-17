// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { normalizeImageType } from "./media-file-type";

/**
 * A colagem traz arquivos com tipo errado ou vazio e o servidor recusa antes de olhar os bytes
 * (ticket do suporte: "tente enviar um JPG ou PNG" para um PNG de verdade). A correção conserta
 * o tipo pela assinatura dos bytes antes de o upload sair daqui.
 */

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const TEXTE = new Uint8Array([0x6f, 0x6c, 0xc3, 0xa1, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("normalizeImageType — tipo vindo da área de transferência", () => {
  it("conserta o image/jpg (não é MIME válido) para image/jpeg", async () => {
    const file = new File([JPEG], "foto.jpg", { type: "image/jpg" });

    const normalized = await normalizeImageType(file);

    expect(normalized.type).toBe("image/jpeg");
    expect(normalized.name).toBe("foto.jpg");
  });

  it("descobre PNG pela assinatura quando o clipboard cola sem tipo", async () => {
    const file = new File([PNG], "image.png", { type: "" });

    expect((await normalizeImageType(file)).type).toBe("image/png");
  });

  it("descobre JPEG pela assinatura quando não há tipo", async () => {
    const file = new File([JPEG], "image.jpeg", { type: "" });

    expect((await normalizeImageType(file)).type).toBe("image/jpeg");
  });

  it("descobre GIF e WEBP pela assinatura quando não há tipo", async () => {
    expect((await normalizeImageType(new File([GIF], "a", { type: "" }))).type).toBe("image/gif");
    expect((await normalizeImageType(new File([WEBP], "a", { type: "" }))).type).toBe("image/webp");
  });

  it("não inventa tipo: arquivo sem tipo e sem assinatura conhecida segue como veio", async () => {
    const file = new File([TEXTE], "arquivo", { type: "" });

    expect((await normalizeImageType(file)).type).toBe("");
  });

  it("devolve o mesmo arquivo quando o tipo já é válido", async () => {
    const file = new File([PNG], "print.png", { type: "image/png" });

    expect(await normalizeImageType(file)).toBe(file);
  });
});
