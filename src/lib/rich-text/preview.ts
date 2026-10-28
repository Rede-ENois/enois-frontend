import { type RichNode, parseRichText } from "@rede-enois/design-system/domain";

/** Quanto do começo do texto entra na prévia (o corte final é na última palavra inteira). */
const PREVIEW_LIMIT = 180;

/** O que não é texto de leitura: fica fora do resumo em vez de virar sujeira no meio da frase. */
const SKIPPED: ReadonlySet<RichNode["kind"]> = new Set([
  "image",
  "codeBlock",
  "divider",
  "spoiler",
]);

/** Blocos cujos filhos são itens inteiros (e não pedaços da mesma frase): entre eles, espaço. */
const SPACED: ReadonlySet<RichNode["kind"]> = new Set(["list", "table", "tableRow"]);

/**
 * O comecinho de um texto formatado, em texto puro — o resumo que a lista do blog mostra embaixo
 * do título.
 *
 * Passa pelo MESMO parser do post, e não por uma limpeza de expressão regular: assim o resumo lê
 * como o post (`**negrito**`, `[link](url)` e `- lista` já resolvidos) e o que a pessoa escreveu
 * para não aparecer de imediato — imagem de terceiro, bloco de código, spoiler — também não aparece
 * aqui.
 */
export function plainPreview(content: string, limit = PREVIEW_LIMIT): string {
  const text = parseRichText(content)
    .map(textOf)
    .filter((block) => block.trim() !== "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= limit) return text;
  // Corta na última palavra inteira: resumo com palavra picada lê pior que resumo menor.
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function textOf(node: RichNode): string {
  if (SKIPPED.has(node.kind)) return "";
  // Os nós que carregam o próprio texto (texto solto, link, menção, negrito) também trazem os
  // filhos já lidos: fico com o texto e não desço, senão o mesmo trecho entra duas vezes.
  if (node.text) return node.text;

  const parts: string[] = [];
  if (node.children) {
    parts.push(node.children.map(textOf).join(SPACED.has(node.kind) ? " " : ""));
  }
  if (node.nested) parts.push(node.nested.map(textOf).join(" "));
  return parts.join(" ");
}
