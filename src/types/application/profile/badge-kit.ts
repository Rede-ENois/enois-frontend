/** Um conjunto salvo do histórico de emblemas, do mais recente para o mais antigo. */
export type BadgeKit = {
  id: string;
  /** Os emblemas que estavam no perfil, na ordem. */
  badges: string[];
  /** Data do salvamento em ISO; a tela formata. */
  createdAt: string;
};
