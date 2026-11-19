import type { DesafioAuthorView } from "./desafio-author-view";
import type { DesafioStatus } from "./desafio-status";

/**
 * Um desafio como o backend devolve: um convite com responsável nominal, uma janela opcional
 * e a contagem de quem participou. Sem ranking e sem prêmio: `destaqueId` é o reconhecimento
 * nominal que quem convocou escolhe ao encerrar, e é o único veredito que existe.
 */
export type DesafioView = {
  id: string;
  title: string;
  description: string;
  author: DesafioAuthorView;
  createdAt: string;
  /** ISO 8601 do fim da janela; nulo = aberto até alguém encerrar. */
  endsAt: string | null;
  status: DesafioStatus;
  /** Participação reconhecida no encerramento; nulo enquanto convoca. */
  destaqueId: string | null;
  participacoes: number;
  /** Quem vê é quem convocou: a tela oferece os gestos de encerrar e de remover. */
  mine: boolean;
};
