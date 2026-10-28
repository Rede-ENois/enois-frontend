import type { SaciSpotProps } from "@/types/components/events/saci-spot-props";
import { HiddenSaci } from "@rede-enois/design-system/domain";

import { huntSpotVisible } from "@/lib/cosmetics";
import { useSaciHunt } from "@/lib/use-saci-events";

/** One hiding spot of the Saci hunt: shown only while the hunt runs and the spot is not found. */
export function SaciSpot({ spot, className }: SaciSpotProps) {
  const { hunt, find, authenticated } = useSaciHunt();
  if (!huntSpotVisible(hunt.data, spot, authenticated)) return null;
  return (
    <HiddenSaci
      spot={spot}
      pending={find.isPending}
      onFound={() => find.mutate(spot)}
      className={className}
    />
  );
}
