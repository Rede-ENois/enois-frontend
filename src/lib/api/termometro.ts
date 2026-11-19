import type { TermometroJanelaView } from "@/types/application/termometro/termometro-janela-view";

import { api } from "../api-client";

/**
 * Termômetro: o painel do clima coletivo do Explorar.
 *
 * É SÓ leitura — o Termômetro mede o que a comunidade já publicou, não pergunta nada a ninguém
 * (isso seria enquete). A resposta vem agregada: porcentagens por emoção, contagem de
 * manifestações e de pessoas distintas, sem nome, texto ou id de quem escreveu.
 */
export const termometroApi = {
  /** As quatro janelas do painel (Hoje, 24h, 7d, 30d), na ordem de exibição. */
  painel: () => api.get<TermometroJanelaView[]>("/termometro"),
};
