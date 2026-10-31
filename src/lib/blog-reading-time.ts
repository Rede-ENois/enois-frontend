import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";

import { plainPreview } from "@/lib/rich-text/preview";

const WORDS_PER_MINUTE = 200;

/** Estimativa do corpo do post, igual no SSR e no navegador, sem contar marcação ou CSS. */
export function blogReadingMinutes(body: string, format: BlogPostFormat): number {
  const text =
    format === "HTML"
      ? body
          .replace(/<!--[\s\S]*?-->/g, " ")
          .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
          .replace(/<[^>]*>/g, " ")
          .replace(/&(?:nbsp|#0*32|#x0*20|#0*160|#x0*a0);/gi, " ")
          .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, "a")
      : plainPreview(body, Infinity);
  const words = text.match(/\S+/g)?.length ?? 0;
  // Mesmo um post curto é apresentado como um minuto, sem sugerir precisão em segundos.
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
