/** Em que ponto da chamada a tela está agora. */
export type CallPhase =
  /** Nada aberto. */
  | "idle"
  /** 1:1 que eu iniciei e ainda está tocando. */
  | "calling"
  /** Recebi uma chamada 1:1 e ainda não decidi. */
  | "incoming"
  /** Entrando na sala (pedido de token ao servidor). */
  | "joining"
  /** Dentro da sala: o iframe do Jitsi está na tela. */
  | "live"
  /** Terminou (mostra o motivo e o botão de fechar). */
  | "ended"
  /** Erro explícito (sem infra, sem permissão, chamada vencida). */
  | "error";
