import { texts } from "@/texts";

/**
 * Erro com tradução nossa nos Murais: limite e restrição têm frase própria, título e descrição
 * longos também; o resto cai na genérica de quem chamou.
 */
export function mensagemDeErroMural(erro: unknown, generica: string): string {
  const codigo = (erro as { code?: string }).code;
  if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
    return texts.murais.rateLimitError;
  }
  if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
    return texts.murais.restrictedError;
  }
  if (codigo === "MURAL_TITLE_TOO_LONG") {
    return texts.murais.titleTooLongError;
  }
  if (codigo === "CONTENT_TOO_LONG") {
    return texts.murais.descriptionTooLongError;
  }
  return generica;
}
