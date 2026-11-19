import type { PapoPublicacaoView } from "@rede-enois/design-system/domain";

/**
 * Uma publicação que falou do assunto aberto, como o painel a mostra.
 *
 * O backend manda `criadoEm` em ISO e `anonima` (o anonimato é do espaço, não da tela); a
 * camada de API formata a data em `quando` e o painel usa o autor nulo para não nomear ninguém.
 */
export type PapoPublicacaoRelacionadaView = PapoPublicacaoView;
