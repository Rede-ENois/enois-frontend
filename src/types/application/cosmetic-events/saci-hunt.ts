import type { HuntSpot } from "@/types/application/cosmetic-events/hunt-spot";

/** The Saci hunt; `found` is empty without a session. */
export type SaciHunt = {
  active: boolean;
  startsAt: string;
  endsAt: string;
  spots: number;
  found: HuntSpot[];
  completed: boolean;
};
