/** O convite que alguém publica: título curto, o que fazer e a janela opcional de prazo. */
export type PublishDesafioInput = {
  title: string;
  description: string;
  /** ISO 8601; ausente = aberto até quem convocou encerrar. */
  endsAt?: string;
};
