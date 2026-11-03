export type MuteUserDialogProps = {
  userId: string;
  name: string;
  /** Já silenciado: o botão vira "Remover silêncio" e o menu de prazo some. */
  muted: boolean;
  /**
   * Prazo atual, quando já silenciado com data (ISO). `null`/ausente = sem prazo.
   * Serve só para a legenda dizer quando volta; o `muted` decide o que o botão faz.
   */
  expiresAt?: string | null;
  onDone?: () => void;
};
