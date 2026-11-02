export type ConnectionStatusResult = {
  targetUserId: string;
  status: "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";
  /** Se o pedido pendente foi enviado por mim; `false` quando recebi e em qualquer outro status. */
  requestedByMe: boolean;
  /** Se eu bloqueei esta pessoa (ela some para mim em todo o app). */
  blocked: boolean;
  /** Se eu silenciei esta pessoa (ela some do meu feed, mensagens e notificações). */
  muted: boolean;
};
