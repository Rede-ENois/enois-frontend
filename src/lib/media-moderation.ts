import { ApiError } from "@/lib/api-client";

/**
 * O arquivo foi barrado por conteúdo impróprio (não por tipo nem por falha de verificação).
 * É o único caso em que a tela abre a lição de bons modos: nos outros o arquivo só fica
 * bloqueado, porque não houve violação de regra para explicar.
 */
export function isProhibitedContent(error: unknown): boolean {
  return error instanceof ApiError && error.code === "IMAGE_CONTENT_NOT_ALLOWED";
}
