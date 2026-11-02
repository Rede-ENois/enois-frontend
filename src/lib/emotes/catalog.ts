import { emoteImageUrl } from "./api";

/**
 * Índice código → endereço da imagem. É o mapa que o texto consulta a cada palavra: no backend ele
 * vem compacto (`KEKW` → caminho do proxy) e aqui cada caminho vira URL absoluta.
 */
export function emoteIndex(entries: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(entries).map(([code, path]) => [code, emoteImageUrl(path)]));
}

const WHITESPACE = /(\s+)/;
/** Caracteres que podem encostar na figurinha sem fazer parte do código (`(KEKW)`). */
const TOKEN_BOUNDARY = /^([([{'"*_~]*)(.*?)([)\]}>.,;:!?'"*_~]*)$/;

function marca(code: string, url: string): string {
  return `![${code}](${url})`;
}

function replaceToken(piece: string, index: Map<string, string>): string {
  const direto = index.get(piece);
  if (direto) return marca(piece, direto);

  const partes = TOKEN_BOUNDARY.exec(piece);
  if (!partes) return piece;
  const url = index.get(partes[2]);
  if (!url) return piece;
  return `${partes[1]}${marca(partes[2], url)}${partes[3]}`;
}

/**
 * Troca os códigos conhecidos por imagem, preservando o resto do texto EXATAMENTE como está.
 *
 * A saída já é o markdown que o RichText do design system desenha como imagem inline: o texto
 * gravado continua sendo o código (quem edita vê `KEKW`, não um endereço de CDN). Bloco e trecho
 * de código ficam intactos — lá dentro o código é código.
 *
 * O índice é o do BACKEND: só vira figurinha o código que existe no catálogo dele, então a mesma
 * imagem aparece para quem lê — inclusive em post público, sem sessão.
 */
export function applyEmotes(content: string, index: Map<string, string>): string {
  if (!content || index.size === 0) return content;

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
          posicao % 2 === 1
            ? pedaco
            : pedaco
                .split(WHITESPACE)
                .map((token) => (WHITESPACE.test(token) ? token : replaceToken(token, index)))
                .join(""),
        )
        .join("");
    })
    .join("\n");
}
