/**
 * URL de prévia de mídia que pode ir para um `src`.
 *
 * A prévia do compositor é sempre um `blob:` criado por `URL.createObjectURL` a partir do arquivo
 * que a própria pessoa escolheu. O valor só vira `src` depois de ser interpretado como URL e ter o
 * protocolo confirmado como `blob:` — texto, `javascript:` ou `data:` não passam pelo parser e o
 * atributo nunca carrega conteúdo arbitrário.
 */
export function mediaPreviewUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "blob:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
