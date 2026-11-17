import { texts } from "@/texts";

/**
 * Erro com tradução nossa nas Coleções: limite e restrição têm frase própria, título e
 * descrição longos também; o resto cai na genérica de quem chamou.
 */
export function mensagemDeErroColecao(erro: unknown, generica: string): string {
  const codigo = (erro as { code?: string }).code;
  if (codigo === "RATE_LIMITED" || codigo === "TOO_MANY_REQUESTS") {
    return texts.colecoes.rateLimitError;
  }
  if (codigo === "RESTRICTED" || codigo === "SANCTIONED") {
    return texts.colecoes.restrictedError;
  }
  if (codigo === "COLECAO_TITLE_TOO_LONG") {
    return texts.colecoes.titleTooLongError;
  }
  if (codigo === "CONTENT_TOO_LONG") {
    return texts.colecoes.descriptionTooLongError;
  }
  return generica;
}
