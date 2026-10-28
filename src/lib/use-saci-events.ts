import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { HuntSpot } from "@/types/application/cosmetic-events/hunt-spot";
import type { SaciDuel } from "@/types/application/cosmetic-events/saci-duel";
import type { SaciHunt } from "@/types/application/cosmetic-events/saci-hunt";
import type { SaciHalloweenTeam } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { cosmeticEventsApi } from "./api";
import { cosmeticErrorMessage, invalidateCosmetics } from "./cosmetics";
import { useIsAuthenticated } from "./use-auth";

const DUEL_KEY = ["eventos", "saci-halloween"] as const;
const HUNT_KEY = ["eventos", "caca-saci"] as const;
const EVENT_STALE_MS = 60_000;

/** The Saci × Halloween duel and the team choice (the choice grants the team badge). */
export function useSaciDuel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const duel = useQuery({
    queryKey: DUEL_KEY,
    queryFn: () => cosmeticEventsApi.duel(),
    staleTime: EVENT_STALE_MS,
  });
  const choose = useMutation({
    mutationFn: (team: SaciHalloweenTeam) => cosmeticEventsApi.choose(team),
    onSuccess: (next: SaciDuel) => {
      queryClient.setQueryData(DUEL_KEY, next);
      invalidateCosmetics(queryClient);
      toast(texts.cosmetics.duelChosen, "success");
    },
    onError: (error) => toast(cosmeticErrorMessage(error), "error"),
  });
  return { duel, choose };
}

/** The Saci hunt of whoever is signed in; finding the seventh spot grants the badge. */
export function useSaciHunt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authenticated = useIsAuthenticated();
  const hunt = useQuery({
    queryKey: HUNT_KEY,
    queryFn: () => cosmeticEventsApi.hunt(),
    enabled: authenticated,
    staleTime: EVENT_STALE_MS,
  });
  const find = useMutation({
    mutationFn: (spot: HuntSpot) => cosmeticEventsApi.find(spot),
    onSuccess: (next: SaciHunt) => {
      queryClient.setQueryData(HUNT_KEY, next);
      if (next.completed) {
        invalidateCosmetics(queryClient);
        toast(texts.cosmetics.huntCompleted, "success");
        return;
      }
      toast(texts.cosmetics.huntFound(next.found.length, next.spots), "success");
    },
    onError: (error) => toast(cosmeticErrorMessage(error), "error"),
  });
  return { hunt, find, authenticated };
}
