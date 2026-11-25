import { describe, expect, it } from "vitest";

import { sintomaDoArquivo, tipoPorBytes } from "./arquivo";

/**
 * A leitura local do arquivo. A decisão de verdade é do backend (a mesma checagem roda sobre os
 * bytes recebidos); aqui só o que dá para dizer antes de gastar uma subida.
 */
describe("sintomaDoArquivo", () => {
  const png = () =>
    new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "a.png");

  it("recusa arquivo acima do teto antes de olhar o conteúdo", async () => {
    const grande = new File([new Uint8Array(512 * 1024 + 1)], "a.png");
    expect(await sintomaDoArquivo(grande)).toEqual({ sintoma: "FIGURINHA_ARQUIVO_GRANDE" });
  });

  it("recusa o formato pelo conteúdo, não pela extensão", async () => {
    const gif = new File(["GIF89a"], "renomeado.png", { type: "image/png" });
    expect(await sintomaDoArquivo(gif)).toEqual({ sintoma: "FIGURINHA_FORMATO" });
  });
});

describe("tipoPorBytes", () => {
  it("lê a assinatura de PNG e JPEG", () => {
    expect(tipoPorBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    expect(tipoPorBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(tipoPorBytes(new Uint8Array([0x47, 0x49, 0x46]))).toBeNull();
  });
});
