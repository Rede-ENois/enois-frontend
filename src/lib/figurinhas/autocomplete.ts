import type { ConsultaDeFigurinha } from "@/types/application/figurinhas/consulta-de-figurinha";

/**
 * O `:palavra` que está sendo digitado no texto.
 *
 * O autocomplete abre quando a pessoa digita `:` no começo de uma palavra e ainda não fechou. A
 * troca aceita só se o trecho continuar igual ao que estava quando a sugestão foi escolhida — se a
 * pessoa mexeu no texto, nada é substituído por engano.
 *
 * O `:` só abre no começo de palavra (ou depois de espaço/abre-parêntese/aspas): não pega `12:30`.
 */
const ABERTURA = /(?:^|[\s([{"'*_~>]):([a-z0-9_+-]{0,32})$/i;

/** `null` quando o cursor não está digitando uma figurinha. */
export function consultaDeFigurinha(texto: string, cursor: number): ConsultaDeFigurinha | null {
  const antes = texto.slice(0, cursor);
  const encontrado = ABERTURA.exec(antes);
  if (!encontrado) return null;
  const termo = encontrado[1] ?? "";
  return { start: cursor - termo.length - 1, end: cursor, query: termo.toLowerCase() };
}

/** Troca `:termo` por `:codigo:`, com o cursor logo depois, e sem apagar o resto do texto. */
export function inserirFigurinha(
  texto: string,
  consulta: ConsultaDeFigurinha,
  codigo: string,
): { texto: string; cursor: number } {
  const codigoLimpo = codigo.replace(/^:+|:+$/g, "");
  const completo = `:${codigoLimpo}:`;
  const cursor = consulta.start + completo.length;
  return {
    texto: `${texto.slice(0, consulta.start)}${completo}${texto.slice(consulta.end)}`,
    cursor,
  };
}

/** Trecho entre crases — o que a pessoa escreveu como código continua como código. */
const CRASE = /`[^`]*`/g;

/**
 * Códigos `:x:` de um texto, sem repetir, em ordem de aparecimento. É o que o RichText pede ao
 * índice da comunidade — só os que estão no texto, não o catálogo inteiro.
 */
export function codigosNoTexto(texto: string): string[] {
  const vistos = new Set<string>();
  const codigos: string[] = [];
  const semCrase = texto.replace(CRASE, " ");
  for (const encontrado of semCrase.matchAll(/:([^\s:[\]]{1,64}):/gu)) {
    const codigo = encontrado[1];
    if (codigo && !vistos.has(codigo)) {
      vistos.add(codigo);
      codigos.push(codigo);
    }
  }
  return codigos;
}
