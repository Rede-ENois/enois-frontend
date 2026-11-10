/**
 * As réguas de uma rodada de liberação da verificação (`policy` do painel admin).
 *
 * <p>Nada disso é fixo no código: o que manda é o que está salvo aqui.</p>
 */
export type IdentityReleasePolicy = {
  usersPerRound: number;
  intervalMinutes: number;
  minReputation: number;
  reservedQuotaPercent: number;
  maxSimultaneous: number;
  paused: boolean;
  nextRoundAt: string | null;
};
