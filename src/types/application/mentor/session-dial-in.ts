/** Como entrar numa sala Jitsi por telefone (API pública do Jitsi). */
export type SessionDialIn = {
  conference: string;
  /** PIN da conferência, quando a API o informa. */
  pin: string | null;
  /** Números de discagem; vazio quando a API não respondeu. */
  numbers: string[];
};
