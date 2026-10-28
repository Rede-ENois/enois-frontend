import type { HuntSpot } from "@/types/application/cosmetic-events/hunt-spot";

export type SaciSpotProps = {
  spot: HuntSpot;
  /** Placement on the page; the Saci never sits over content or controls. */
  className?: string;
};
