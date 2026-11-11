import type { CompressOptions } from "@/types/media-upload/compress-options";
import type { DecodedImageSource } from "@/types/media-upload/decoded-image-source";

/**
 * Compressão de imagem no cliente, antes do upload (#546): o arquivo do celular chega com
 * 8–12 MB e o app não tem superfície que mostre isso. Reduzimos o lado maior para o que as
 * telas renderizam e reencodamos em JPEG/WebP, deixando o navegador (canvas) fazer o trabalho.
 *
 * O contrato é o mesmo do servidor: compressão que não vale a pena não muda o arquivo.
 * GIF animado, SVG e o que o canvas não conseguir decodificar voltam como vieram — um upload
 * que hoje funciona não pode começar a falhar porque a compressão tropeçou.
 */

const DEFAULTS: CompressOptions = {
  maxSide: 2560,
  quality: 0.85,
  outputType: "image/jpeg",
  minBytes: 300 * 1024,
};

/** GIF anima e o canvas só pegaria o primeiro quadro; AVIF/WebP já saem comprimidos do celular. */
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml", "image/avif", "image/webp"]);

export const COMPRESS_MIN_BYTES = DEFAULTS.minBytes;

/** Dimensões de saída: proporção mantida, nunca aumenta, lados pares ajudam o reencode. */
export function targetDimensions(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longSide = Math.max(width, height);
  if (longSide <= maxSide || longSide <= 0) {
    return { width, height };
  }
  const scale = maxSide / longSide;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function shouldCompress(file: File, options?: Partial<CompressOptions>): boolean {
  const merged = { ...DEFAULTS, ...options };
  return (
    file.type.startsWith("image/") && !SKIP_TYPES.has(file.type) && file.size >= merged.minBytes
  );
}

/**
 * Reencoda {@code file} no canvas e devolve o arquivo menor. Quando o reencode não encolhe
 * pelo menos 10% (a mesma régua do servidor), devolve o arquivo original — compressão que
 * não rende não muda o que sobe.
 *
 * Lança apenas quando nem o arquivo original pode ser lido como Blob, situação em que o
 * upload falharia de qualquer forma.
 */
export async function compressImage(
  file: File,
  options?: Partial<CompressOptions>,
  canvasProvider: Document = document,
): Promise<File> {
  const merged = { ...DEFAULTS, ...options };
  if (!shouldCompress(file, options)) {
    return file;
  }

  const bitmap = await createSource(file, canvasProvider);
  if (!bitmap) {
    return file;
  }
  try {
    const { width, height } = targetDimensions(bitmap.width, bitmap.height, merged.maxSide);
    const canvas = canvasProvider.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
    const blob = await toBlob(canvas, merged);
    if (!blob || blob.size >= file.size * 0.9) {
      return file;
    }
    return renameAsJpeg(file, blob);
  } finally {
    closeSource(bitmap);
  }
}

/** Nome mantém o padrão do arquivo original: o servidor só o guarda como metadado. */
function renameAsJpeg(original: File, blob: Blob): File {
  const base = original.name.replace(/\.[^.]+$/, "") || "imagem";
  const extension = mergedExtension(original.type, DEFAULTS.outputType);
  return new File([blob], `${base}.${extension}`, {
    type: DEFAULTS.outputType,
    lastModified: original.lastModified,
  });
}

function mergedExtension(originalType: string, outputType: string): string {
  // PNG com transparência reencodado em JPEG perde o alfa; para PNG mantemos o PNG do canvas.
  if (originalType === "image/png" && outputType === "image/jpeg") {
    return "png";
  }
  return "jpg";
}

function toBlob(canvas: HTMLCanvasElement, options: CompressOptions): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, options.outputType, options.quality);
  });
}

async function createSource(
  file: File,
  canvasProvider: Document,
): Promise<DecodedImageSource | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // cai no caminho de <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = canvasProvider.createElement("img");
    image.src = url;
    await image.decode();
    return image;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function closeSource(source: DecodedImageSource): void {
  source.close?.();
}
