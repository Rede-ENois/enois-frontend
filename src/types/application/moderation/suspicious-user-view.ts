export type SuspiciousUserView = {
  username: string;
  name: string;
  createdAt: string;
  emailVerified: boolean;
  posts: number;
  comments: number;
  reportsAgainst: number;
  riskScore: number;
  signals: string[];
  /**
   * Conta da equipe (admin ou moderador aprovado). Aparece na fila mesmo assim — no incidente
   * de 22/10 uma conta do atacante sumia do painel por ser tratada como moderadora. A
   * automação nunca pune a equipe; a decisão fica com um humano.
   */
  staff: boolean;
};
