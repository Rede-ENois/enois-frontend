import { emoteImageUrl } from "./api";
import { getEnoisEmojiByCode, replaceUnicodeWithEnoisEmojis } from "./enois-pack";

/**
 * Índice código → endereço da imagem. É o mapa que o texto consulta a cada palavra: no backend ele
 * vem compacto (`KEKW` → caminho do proxy) e aqui cada caminho vira URL absoluta.
 */
export function emoteIndex(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries).map(([code, path]) => [code, emoteImageUrl(path)]));
}

const WHITESPACE = /(\s+)/;
/** `:KEKW:`. Same code shape the index cache accepts: no whitespace, colon, brackets or backtick. */
const COLON_CODE = /:([^\s:[\]`]{1,64}):/gu;

/**
 * Until this instant a bare code (`KEKW`) also became a sticker. That caught ordinary words that
 * happen to be codes ("Pedro"), so text written from here on needs `:KEKW:` (issue #556). Older
 * posts, comments and messages keep rendering the way their authors saw them.
 */
export const BARE_EMOTE_CODES_UNTIL = Date.parse("2026-11-03T03:00:00Z");

/** Whether text written at `writtenAt` (ISO) still uses the bare-code format. */
export function usesBareEmoteCodes(writtenAt: string | undefined): boolean {
  if (!writtenAt) return false;
  const time = Date.parse(writtenAt);
  return Number.isFinite(time) && time < BARE_EMOTE_CODES_UNTIL;
}

function resolveEmoteUrl(code: string, index: Map<string, string>): string | undefined {
  return index.get(code) ?? getEnoisEmojiByCode(code)?.src;
}

function replaceColonCodes(text: string, index: Map<string, string>): string {
  return text.replace(COLON_CODE, (match, code: string) => {
    const url = resolveEmoteUrl(code, index);
    return url ? marca(code, url) : match;
  });
}
/** Caracteres que podem encostar na figurinha sem fazer parte do código (`(KEKW)`). */
const TOKEN_BOUNDARY = /^([([{'"*_~]*)(.*?)([)\]}>.,;:!?'"*_~]*)$/;

function marca(code: string, url: string): string {
  return `![${code}](${url})`;
}

function replaceToken(piece: string, index: Map<string, string>): string {
  const direto = resolveEmoteUrl(piece, index);
  if (direto) return marca(piece, direto);

  const partes = TOKEN_BOUNDARY.exec(piece);
  if (!partes) return piece;
  const url = resolveEmoteUrl(partes[2], index);
  if (!url) return piece;
  return `${partes[1]}${marca(partes[2], url)}${partes[3]}`;
}

function transformPlainSegment(
  segment: string,
  index: Map<string, string>,
  bareCodes: boolean,
): string {
  const withCustomUnicode = replaceUnicodeWithEnoisEmojis(segment);
  // Avoid touching markdown images just emitted (alt can be a Unicode emoji like ![👍](...)).
  return withCustomUnicode
    .split(/(!\[[^\]]*\]\([^)]+\))/)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      const withColons = replaceColonCodes(part, index);
      if (!bareCodes) return withColons;
      return withColons
        .split(WHITESPACE)
        .map((token) => (WHITESPACE.test(token) ? token : replaceToken(token, index)))
        .join("");
    })
    .join("");
}

/**
 * Troca os códigos conhecidos (`:KEKW:`, e o código solto quando `bareCodes`) e os emojis Unicode
 * cobertos pelo pacote É Nóis por imagem, preservando o resto do texto EXATAMENTE como está.
 *
 * A saída já é o markdown que o RichText do design system desenha como imagem inline: o texto
 * gravado continua sendo o código ou Unicode real (quem edita vê `👍` ou `:KEKW:`, não um endereço
 * de CDN). Bloco e trecho de código ficam intactos — lá dentro o código é código.
 */
export function applyEmotes(
  content: string,
  index: Map<string, string>,
  bareCodes = false,
): string {
  if (!content) return content;

  let emBloco = false;
  return content
    .split("\n")
    .map((linha) => {
      if (/^\s*```/.test(linha)) {
        emBloco = !emBloco;
        return linha;
      }
      if (emBloco || !linha) return linha;
      return linha
        .split(/(`[^`]*`)/)
        .map((pedaco, posicao) =>
          posicao % 2 === 1 ? pedaco : transformPlainSegment(pedaco, index, bareCodes),
        )
        .join("");
    })
    .join("\n");
}
