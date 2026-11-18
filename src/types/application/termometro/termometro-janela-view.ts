import type { TermometroEmocao, TermometroPeriodo } from "@rede-enois/design-system/domain";

/**
 * O clima de UMA janela do Termômetro, como o backend devolve.
 *
 * Não existe autor, texto nem id de pessoa aqui: o painel mede o conjunto, não a pessoa. A
 * porcentagem já vem calculada do servidor; a tela não refaz conta nenhuma.
 */
export type TermometroJanelaView = {
  periodo: TermometroPeriodo;
  /** Falso quando a janela tem gente de menos para mostrar indicador confiável. */
  amostraSuficiente: boolean;
  manifestacoes: number;
  participantes: number;
  /** A emoção que domina a janela; sem dominante é null. */
  dominante: TermometroEmocao | null;
  emocoes: { emocao: TermometroEmocao; porcentagem: number; contagem: number }[];
};
