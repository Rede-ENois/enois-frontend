import type { HuntSpot } from "@/types/application/cosmetic-events/hunt-spot";
import type { SaciDuel } from "@/types/application/cosmetic-events/saci-duel";
import type { SaciHunt } from "@/types/application/cosmetic-events/saci-hunt";
import type { SaciHalloweenTeam } from "@rede-enois/design-system/domain";
import { z } from "zod";

import { api } from "../api-client";

export const HUNT_SPOTS = [
  "feed",
  "vagas",
  "comunidades",
  "blog",
  "carteira",
  "mensagens",
  "perfil",
] as const satisfies readonly HuntSpot[];

const teamSchema = z.enum(["saci", "halloween"]);
const count = z.number().int().nonnegative();

const duelSchema = z.object({
  active: z.boolean(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  counts: z.object({ saci: count, halloween: count }),
  myChoice: teamSchema.nullable(),
  winner: teamSchema.nullable(),
});

const huntSchema = z.object({
  active: z.boolean(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  spots: z.number().int().positive(),
  found: z.array(z.enum(HUNT_SPOTS)),
  completed: z.boolean(),
});

/** The free events of the cosmetics shop: the Saci × Halloween duel and the Saci hunt. */
export const cosmeticEventsApi = {
  duel: async (): Promise<SaciDuel> =>
    duelSchema.parse(await api.get<unknown>("/eventos/saci-halloween")),
  choose: async (choice: SaciHalloweenTeam): Promise<SaciDuel> =>
    duelSchema.parse(await api.post<unknown>("/eventos/saci-halloween/escolha", { choice })),
  hunt: async (): Promise<SaciHunt> =>
    huntSchema.parse(await api.get<unknown>("/eventos/caca-saci")),
  find: async (spot: HuntSpot): Promise<SaciHunt> =>
    huntSchema.parse(await api.post<unknown>(`/eventos/caca-saci/achados/${spot}`, {})),
};
