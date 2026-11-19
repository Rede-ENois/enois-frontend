import type { DesafioAuthorView } from "./desafio-author-view";

/**
 * Uma participação no mural do desafio, com autoria nominal: quem respondeu o convite assina.
 * A torcida é contada, nunca nominada — só o total e se quem lê torceu.
 */
export type DesafioParticipacaoView = {
  id: string;
  desafioId: string;
  author: DesafioAuthorView;
  content: string;
  createdAt: string;
  cheers: number;
  /** Minha torcida, quando existe; tocar de novo tira. */
  cheered: boolean;
  /** Quem vê é quem escreveu: a tela mostra o gesto de remover a própria. */
  mine: boolean;
};
