import { describe, expect, it, vi } from "vitest";

import { medidasDoSvg, sintomaDoArquivo, tipoPorBytes } from "./arquivo";

/**
 * As medidas de PNG/JPEG/GIF vêm do leitor de imagem do navegador (`Image`), que o ambiente de
 * teste não tem; estes testes usam só os arquivos que se medem sozinhos (SVG) ou que param antes.
 * O stub evita que os casos de formato/medida incompleta dependam do `Image`.
 */
vi.stubGlobal(
  "Image",
  class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 0;
    naturalHeight = 0;
    set src(_url: string) {
      setTimeout(() => this.onerror?.(), 0);
    }
  },
);

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
    const disfarcado = new File(["%PDF-1.7"], "renomeado.png", { type: "image/png" });
    expect(await sintomaDoArquivo(disfarcado)).toEqual({ sintoma: "FIGURINHA_FORMATO" });
  });

  it("o GIF é reconhecido e segue para as medidas", async () => {
    const gif = new File(["GIF89a\x01\x00\x01\x00"], "a.gif", { type: "image/gif" });
    expect(await sintomaDoArquivo(gif)).toEqual({ sintoma: "FIGURINHA_FALHOU" });
  });

  it("o SVG tem as medidas lidas do próprio markup", async () => {
    const svg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect/></svg>'],
      "a.svg",
      { type: "image/svg+xml" },
    );
    expect(await sintomaDoArquivo(svg)).toEqual({
      sintoma: null,
      mimeType: "image/svg+xml",
      largura: 64,
      altura: 48,
    });
  });

  it("o SVG grande demais é recusado pelas medidas do viewBox", async () => {
    const svg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"></svg>'],
      "a.svg",
      { type: "image/svg+xml" },
    );
    expect(await sintomaDoArquivo(svg)).toEqual({ sintoma: "FIGURINHA_DIMENSOES" });
  });

  it("o SVG sem width/height nem viewBox não tem como ser medido", async () => {
    const svg = new File(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], "a.svg", {
      type: "image/svg+xml",
    });
    expect(await sintomaDoArquivo(svg)).toEqual({ sintoma: "FIGURINHA_FALHOU" });
  });

  it("markup que abre em outra tag não é SVG", async () => {
    const html = new File(["<html><body>x</body></html>"], "a.svg", { type: "image/svg+xml" });
    expect(await sintomaDoArquivo(html)).toEqual({ sintoma: "FIGURINHA_FORMATO" });
  });

  it("o PNG é reconhecido e segue para as medidas", async () => {
    expect(await sintomaDoArquivo(png())).toEqual({ sintoma: "FIGURINHA_FALHOU" });
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

  it("lê as duas versões do GIF e recusa cabeçalho sem versão", () => {
    expect(tipoPorBytes(new TextEncoder().encode("GIF87a"))).toBe("image/gif");
    expect(tipoPorBytes(new TextEncoder().encode("GIF89a"))).toBe("image/gif");
    expect(tipoPorBytes(new TextEncoder().encode("GIF8Xa"))).toBeNull();
  });

  it("lê o SVG pela abertura do markup", () => {
    expect(tipoPorBytes(new TextEncoder().encode("<svg"))).toBe("image/svg+xml");
    expect(tipoPorBytes(new TextEncoder().encode("<html"))).toBeNull();
  });
});

describe("medidasDoSvg", () => {
  it("prefere width/height do elemento raiz, mesmo com viewBox", () => {
    expect(medidasDoSvg('<svg width="120" height="80" viewBox="0 0 400 400"></svg>')).toEqual({
      largura: 120,
      altura: 80,
    });
  });

  it("cai para o viewBox quando falta width ou height", () => {
    expect(medidasDoSvg('<svg width="120" viewBox="0 0 300 200"></svg>')).toEqual({
      largura: 300,
      altura: 200,
    });
  });

  it("aceita px e vírgula no viewBox", () => {
    const markup = '<svg xmlns="http://www.w3.org/2000/svg" width="77.4px" height="50.6px"/>';
    expect(medidasDoSvg(markup)).toEqual({ largura: 77, altura: 51 });
    expect(medidasDoSvg('<svg viewBox="0,0,10,20"/>')).toEqual({ largura: 10, altura: 20 });
  });

  it("sem medida, devolve null", () => {
    expect(medidasDoSvg("<svg/>")).toBeNull();
    expect(medidasDoSvg("sem svg")).toBeNull();
  });
});
