/**
 * Mensagem que o service worker manda para a aba quando o clique na notificacao push cai num
 * caminho de API ("/api/feed/posts/xxx"): a rota do app esta na tabela do front, que o worker
 * nao conhece.
 */
export type PushNavigateMessage = {
  type?: string;
  href?: string;
  /** The notification that was tapped, so the app marks it read. */
  notificationId?: string;
};
