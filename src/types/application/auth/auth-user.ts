export type AuthUser = {
  id: string;
  username: string;
  name: string;
  headline: string;
  email: string;
  /** E-mail confirmado pelo link. */
  emailVerified: boolean;
  /** Segundo fator ativo (aplicativo authenticator ou código por e-mail). */
  twoFactorEnabled: boolean;
  /** Conta verificada: e-mail confirmado ou segundo fator ativo — é o que sustenta a reputação. */
  identityVerified: boolean;
  /**
   * A conta tem senha que a pessoa conhece. Quem entrou por login social nasce sem uma: a tela
   * pede para CRIAR a primeira em vez de confirmar a atual.
   */
  hasPassword: boolean;
  /**
   * A pessoa já concluiu ou pulou o onboarding. `false` manda para `/boas-vindas`; ausente (backend
   * antigo) vale como concluído, para nunca prender ninguém fora do feed.
   */
  onboardingCompleted?: boolean;
};
