import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";

import { plainPreview } from "@/lib/rich-text/preview";

const WORDS_PER_MINUTE = 200;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  // Pontuação e símbolos separam palavras; letra acentuada (`&ccedil;`) não separa.
  mdash: " ",
  ndash: " ",
  hellip: " ",
  bull: " ",
  middot: " ",
  laquo: " ",
  raquo: " ",
  ldquo: " ",
  rdquo: " ",
  lsquo: " ",
  rsquo: " ",
  sbquo: " ",
  shy: "",
};

/**
 * Devolve o caractere de cada entidade. Entidade desconhecida vira vazio: ela é parte da palavra
 * (`a&ccedil;&atilde;o` é "ação"), não um separador — e assim não entra na contagem como palavra.
 */
function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z][a-z0-9]*);/gi, (whole, name: string) => {
    const lower = name.toLowerCase();
    if (!lower.startsWith("#")) return NAMED_ENTITIES[lower] ?? "";
    const code = lower.startsWith("#x")
      ? parseInt(lower.slice(2), 16)
      : parseInt(lower.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

/**
 * Troca marcação por espaço. O scanner respeita aspas de atributo (`<p title="a>b">` não termina
 * no `>` do valor) e pula o conteúdo de `script`, `style` e `head`, que não é leitura.
 */
function htmlToText(body: string): string {
  const lower = body.toLowerCase();
  let text = "";
  let index = 0;

  while (index < body.length) {
    if (body[index] !== "<") {
      text += body[index];
      index += 1;
      continue;
    }

    if (body.startsWith("<!--", index)) {
      const end = body.indexOf("-->", index + 4);
      index = end === -1 ? body.length : end + 3;
      text += " ";
      continue;
    }

    let cursor = index + 1;
    let quote: string | null = null;
    while (cursor < body.length) {
      const char = body[cursor];
      if (quote !== null) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === ">") {
        break;
      }
      cursor += 1;
    }

    const tag = lower.slice(index + 1, cursor);
    index = cursor + 1;
    text += " ";

    const raw = /^\s*(script|style|head)\b/.exec(tag);
    if (!raw) continue;
    const closing = lower.indexOf(`</${raw[1]}`, index);
    if (closing === -1) break;
    const end = body.indexOf(">", closing);
    index = end === -1 ? body.length : end + 1;
  }

  return text;
}

/** Estimativa do corpo do post, igual no SSR e no navegador, sem contar marcação ou CSS. */
export function blogReadingMinutes(body: string, format: BlogPostFormat): number {
  const text = format === "HTML" ? decodeEntities(htmlToText(body)) : plainPreview(body, Infinity);
  // Palavra é sequência com letra ou número: um "&" solto, um traço ou um emoji não são leitura.
  const words = text.match(/[\p{L}\p{N}]+(?:['’‑-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  // Mesmo um post curto é apresentado como um minuto, sem sugerir precisão em segundos.
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
