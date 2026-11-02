/** Estado dos avisos no navegador deste aparelho (a inscrição de push). */
export type PushState = {
  /** Inscrição válida para a chave que o servidor anuncia hoje. */
  active: boolean;
  /** Navegador suporta e o servidor tem VAPID configurado. */
  available: boolean;
  /** Permissão negada no navegador: só dá para liberar nas configurações do aparelho. */
  denied: boolean;
  /** Pedido de permissão ou remoção da inscrição em andamento. */
  busy: boolean;
  toggle: () => void;
};
