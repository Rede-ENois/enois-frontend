import type { CatalogOrder } from "@/types/application/loja/catalog-order";
import type { LojaCollection } from "@/types/application/loja/loja-collection";
import type { LojaItem } from "@/types/application/loja/loja-item";
import type { LookPurchase } from "@/types/application/loja/look-purchase";
import type { ProfileStatus } from "@/types/application/profile/profile-status";
import { z } from "zod";

import { api } from "../api-client";

const kindSchema = z.enum([
  "FRAME",
  "BADGE",
  "NAME_STYLE",
  "NAMEPLATE",
  "BANNER",
  "CARD_THEME",
  "PROFILE_EFFECT",
]);

const catalogSchema = z.array(
  z.object({
    id: z.string().min(1),
    kind: kindSchema,
    collection: z.string().min(1).nullable(),
    name: z.string(),
    description: z.string(),
    priceMf: z.number().int().nonnegative(),
    cssRing: z.string(),
    releaseOrder: z.number().int().positive(),
    available: z.boolean(),
    purchasable: z.boolean(),
    owned: z.boolean().optional(),
    equipped: z.boolean().optional(),
  }),
);

const MONTH_DAY = /^\d{2}-\d{2}$/;

const collectionsSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string(),
    available: z.boolean(),
    windows: z.array(
      z.object({ start: z.string().regex(MONTH_DAY), end: z.string().regex(MONTH_DAY) }),
    ),
    looks: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string(),
        items: z.array(z.string().min(1)),
        statusIcon: z.string().nullable(),
        statusText: z.string().nullable(),
      }),
    ),
  }),
);

const ownedSchema = z.object({ id: z.string().min(1), owned: z.boolean() });
const equippedSchema = z.object({ id: z.string().min(1), equipped: z.boolean() });
const lookPurchaseSchema = z.object({
  id: z.string().min(1),
  bought: z.array(z.string().min(1)),
  priceMf: z.number().int().nonnegative(),
});
/** `PUT /me/status` answers with the whole public profile; only the status is read here. */
const statusSchema = z.object({
  statusText: z.string().nullable(),
  statusIcon: z.string().nullable(),
});

/** A loja de cosméticos: compra direta (auditada no ledger) e equipar. */
export const lojaApi = {
  catalog: async (order: CatalogOrder = "oldest"): Promise<LojaItem[]> => {
    const items = catalogSchema.parse(await api.get<unknown>(`/loja?order=${order}`));
    const ids = new Set(items.map((item): string => item.id));
    if (
      ids.size !== items.length ||
      items.some((item, index): boolean => {
        if (index === 0) return false;
        const previous = items[index - 1].releaseOrder;
        return order === "oldest" ? item.releaseOrder <= previous : item.releaseOrder >= previous;
      })
    ) {
      throw new Error("O catálogo não respeitou a ordenação solicitada.");
    }
    return items;
  },
  collections: async (): Promise<LojaCollection[]> =>
    collectionsSchema.parse(await api.get<unknown>("/loja/colecoes")),
  buy: async (itemId: string): Promise<{ id: string; owned: boolean }> =>
    ownedSchema.parse(await api.post<unknown>(`/loja/${encodeURIComponent(itemId)}/comprar`, {})),
  buyLook: async (lookId: string): Promise<LookPurchase> =>
    lookPurchaseSchema.parse(
      await api.post<unknown>(`/loja/looks/${encodeURIComponent(lookId)}/comprar`, {}),
    ),
  equip: async (itemId: string): Promise<{ id: string; equipped: boolean }> =>
    equippedSchema.parse(
      await api.post<unknown>(`/loja/${encodeURIComponent(itemId)}/equipar`, {}),
    ),
  unequip: async (itemId: string): Promise<{ id: string; equipped: boolean }> =>
    equippedSchema.parse(
      await api.post<unknown>(`/loja/${encodeURIComponent(itemId)}/desequipar`, {}),
    ),
  /** Empty text clears the status; `icon` is a free icon or the icon of an owned official badge. */
  setStatus: async (text: string, icon: string | null): Promise<ProfileStatus> =>
    statusSchema.parse(await api.put<unknown>("/me/status", { text, icon })),
};
