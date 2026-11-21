import { ApiError } from "./api-client";

/**
 * Se o servidor recusou porque o quadro (coleção ou mural) não existe mais para quem lê.
 *
 * Só o 404 é "não encontrado". Sessão que não chegou, servidor instável ou rede caída não são: a
 * tela precisa oferecer o "tentar de novo" em vez de mandar a pessoa procurar uma coleção que
 * continua lá (#994, #996, #997).
 */
export function quadroAusente(erro: unknown): boolean {
  return erro instanceof ApiError && erro.status === 404;
}
