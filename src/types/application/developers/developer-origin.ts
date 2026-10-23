export type DeveloperOrigin = {
  id: string;
  origin: string;
  createdAt: string;
  /** O backend derruba a origem quando ela acumula recusas (401/403/429). */
  blocked: boolean;
  blockedReason: string | null;
  /** Bloqueio automático vence sozinho; bloqueio manual do admin não tem data. */
  blockedUntil: string | null;
};
