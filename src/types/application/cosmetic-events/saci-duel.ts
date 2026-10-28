import type { SaciHalloweenTeam } from "@rede-enois/design-system/domain";

/** The Saci × Halloween duel; `startsAt`/`endsAt` are ISO instants. */
export type SaciDuel = {
  active: boolean;
  startsAt: string;
  endsAt: string;
  counts: Record<SaciHalloweenTeam, number>;
  myChoice: SaciHalloweenTeam | null;
  winner: SaciHalloweenTeam | null;
};
