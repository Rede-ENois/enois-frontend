export type ConnectionStatusResult = {
  targetUserId: string;
  status: "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";
  /** Se eu bloqueei esta pessoa (ela some para mim em todo o app). */
  blocked: boolean;
  /** Se eu silenciei esta pessoa (ela some do meu feed, mensagens e notificações). */
  muted: boolean;
};
