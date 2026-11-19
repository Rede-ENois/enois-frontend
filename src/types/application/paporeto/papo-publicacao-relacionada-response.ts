import type { PapoPublicacaoView } from "@rede-enois/design-system/domain";

/**
 * O que o backend manda em `/papo-reto/{subject}/publicacoes`: a data em ISO e a marca de
 * anonimato que a tela não usa (o painel só precisa do autor nulo).
 */
export type PapoPublicacaoRelacionadaResponse = {
  id: string;
  fonte: PapoPublicacaoView["fonte"];
  texto: string;
  autor: string | null;
  handle: string | null;
  criadoEm: string;
  href: string;
  anonima: boolean;
};
