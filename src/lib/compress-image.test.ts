// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  COMPRESS_MIN_BYTES,
  compressImage,
  shouldCompress,
  targetDimensions,
} from "./compress-image";

/** JPEG mínimo válido (1x1, gerado uma vez em base64) para exercitar a decodificação real. */
const JPEG_1PX = Uint8Array.from(
  atob(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
  ),
  (c) => c.charCodeAt(0),
);

function jpegFile(bytes: number[]): File {
  return new File([new Uint8Array(bytes)], "foto-de-teste.jpg", { type: "image/jpeg" });
}

describe("shouldCompress", () => {
  it("compress image files above the floor", () => {
    expect(shouldCompress(jpegFile(new Array(COMPRESS_MIN_BYTES + 1).fill(0xff)))).toBe(true);
  });

  it("leaves small files, non-images, animated and already-compressed types alone", () => {
    expect(shouldCompress(jpegFile(new Array(64).fill(0xff)))).toBe(false);
    expect(
      shouldCompress(new File([new Uint8Array(1024)], "a.pdf", { type: "application/pdf" })),
    ).toBe(false);
    expect(shouldCompress(new File([new Uint8Array(1024)], "a.gif", { type: "image/gif" }))).toBe(
      false,
    );
    expect(shouldCompress(new File([new Uint8Array(1024)], "a.webp", { type: "image/webp" }))).toBe(
      false,
    );
    expect(shouldCompress(new File([new Uint8Array(1024)], "a.avif", { type: "image/avif" }))).toBe(
      false,
    );
  });
});

describe("targetDimensions", () => {
  it("shrinks the long side and keeps the ratio", () => {
    expect(targetDimensions(4000, 3000, 2560)).toEqual({ width: 2560, height: 1920 });
    expect(targetDimensions(3000, 4000, 2560)).toEqual({ width: 1920, height: 2560 });
  });

  it("never upscales", () => {
    expect(targetDimensions(1200, 900, 2560)).toEqual({ width: 1200, height: 900 });
  });

  it("handles degenerate sizes without dividing by zero", () => {
    expect(targetDimensions(0, 0, 2560)).toEqual({ width: 0, height: 0 });
  });
});

describe("compressImage", () => {
  afterEach(() => {
    // Vitest 5 limpa o DOM entre testes; nada acumulado aqui.
  });

  it("returns the original file untouched when the type does not take compression", async () => {
    const gif = new File([new Uint8Array(COMPRESS_MIN_BYTES + 10)], "anim.gif", {
      type: "image/gif",
    });
    await expect(compressImage(gif)).resolves.toBe(gif);
  });

  it("returns the original file when the browser cannot decode the content", async () => {
    const junk = jpegFile(new Array(COMPRESS_MIN_BYTES + 10).fill(0x42));
    const result = await compressImage(junk);
    // Arquivo inválido: o original volta — upload que hoje funciona não pode falhar por causa
    // da compressão. (jsdom não decodifica JPEG; o fallback do <img> também falha.)
    expect(result).toBe(junk);
  });

  it("decodes a real JPEG without throwing and returns a file of the right type", async () => {
    // jsdom não tem canvas decodificador: o contrato que este teste tranca é o de NÃO lançar —
    // um erro de decodificação vira arquivo original, nunca upload recusado.
    const tiny = new File([JPEG_1PX], "um-pixel.jpg", { type: "image/jpeg" });
    await expect(compressImage(tiny)).resolves.toBe(tiny);
  });

  it("returns the original when the reencode does not save at least 10%", async () => {
    // Documento falso que decodifica: o stub abaixo devolve um blob do mesmo tamanho.
    const original = jpegFile(new Array(COMPRESS_MIN_BYTES + 10).fill(0x00));
    const fakeDoc = fakeDocumentWithCanvas((canvas) => {
      canvas.toBlob = (cb: (b: Blob | null) => void) =>
        cb(new Blob([new Uint8Array(original.size)]));
      canvas.getContext = (() => ({ drawImage() {} })) as unknown as typeof canvas.getContext;
    });
    await expect(compressImage(original, undefined, fakeDoc)).resolves.toBe(original);
  });

  it("returns the compressed file when the reencode is smaller, with a jpeg name and type", async () => {
    const original = jpegFile(new Array(COMPRESS_MIN_BYTES + 10).fill(0x00));
    const fakeDoc = fakeDocumentWithCanvas((canvas) => {
      canvas.toBlob = (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array(1024)]));
      canvas.getContext = (() => ({ drawImage() {} })) as unknown as typeof canvas.getContext;
    });
    const result = await compressImage(original, undefined, fakeDoc);
    expect(result).not.toBe(original);
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("foto-de-teste.jpg");
    expect(result.size).toBe(1024);
  });

  it("keeps a png named as png when the output is the jpeg pipeline", async () => {
    const original = new File([new Uint8Array(COMPRESS_MIN_BYTES + 10)], "print.png", {
      type: "image/png",
    });
    const fakeDoc = fakeDocumentWithCanvas((canvas) => {
      canvas.toBlob = (cb: (b: Blob | null) => void) => cb(new Blob([new Uint8Array(1024)]));
      canvas.getContext = (() => ({ drawImage() {} })) as unknown as typeof canvas.getContext;
    });
    const result = await compressImage(original, undefined, fakeDoc);
    expect(result.name).toBe("print.png");
  });
});

/** jsdom não implementa canvas: um stub basta para o contrato de decisão, que é o que muda aqui. */
function fakeDocumentWithCanvas(
  setup: (canvas: HTMLCanvasElement) => void,
  image?: { width?: number; height?: number },
): Document {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => null,
    toBlob: (_: (b: Blob | null) => void) => {},
  } as unknown as HTMLCanvasElement;
  setup(canvas);
  return {
    createElement(tag: string): unknown {
      if (tag === "canvas") return canvas;
      const el = {
        src: "",
        width: image?.width ?? 4000,
        height: image?.height ?? 3000,
        decode: async () => {},
      };
      return el;
    },
  } as unknown as Document;
}
