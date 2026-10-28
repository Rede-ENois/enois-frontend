import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { LojaItem } from "@/types/application/loja/loja-item";
import {
  type CosmeticShopCollection,
  type CosmeticShopItem,
  type CosmeticShopLook,
  CosmeticShop as CosmeticShopView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { lojaApi } from "@/lib/api";
import {
  DUEL_COLLECTIONS,
  changesNameStyle,
  cosmeticErrorMessage,
  invalidateCosmetics,
  lookPriceMf,
  profileCardData,
} from "@/lib/cosmetics";
import { useCurrentUser } from "@/lib/current-user";
import { formatFaisca } from "@/lib/faisca";

import { SaciDuelPanel } from "@/components/events/saci-duel-panel";

/** The seasonal cosmetics shop: items, collections with looks, try-on, buy and equip. */
export function CosmeticShop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const catalog = useQuery({ queryKey: ["loja", "oldest"], queryFn: () => lojaApi.catalog() });
  const collections = useQuery({
    queryKey: ["loja", "colecoes"],
    queryFn: () => lojaApi.collections(),
  });

  const setDisplayNameTheme = usePreferencesStore((state) => state.setDisplayNameTheme);
  const setDisplayNameFont = usePreferencesStore((state) => state.setDisplayNameFont);
  const setDisplayNameColor = usePreferencesStore((state) => state.setDisplayNameColor);
  const itemsById = useMemo(
    () => new Map((catalog.data ?? []).map((item): [string, LojaItem] => [item.id, item])),
    [catalog.data],
  );

  // The server changed the name style: the device copy would otherwise keep winning on the profile.
  const syncNameStyle = (ids: readonly string[]): void => {
    if (!changesNameStyle(ids, itemsById)) return;
    setDisplayNameTheme(null);
    setDisplayNameFont(null);
    setDisplayNameColor(null);
  };
  const onSuccess =
    (message: string, touched: (id: string) => readonly string[] = () => []) =>
    (_: unknown, id: string): void => {
      syncNameStyle(touched(id));
      invalidateCosmetics(queryClient);
      toast(message, "success");
    };
  const lookItems = (lookId: string): readonly string[] =>
    collections.data?.flatMap((c) => c.looks).find((look) => look.id === lookId)?.items ?? [];
  const onError = (error: unknown): void => toast(cosmeticErrorMessage(error), "error");
  const buy = useMutation({
    mutationFn: (id: string) => lojaApi.buy(id),
    onSuccess: onSuccess(texts.cosmetics.bought),
    onError,
  });
  const buyLook = useMutation({
    mutationFn: (id: string) => lojaApi.buyLook(id),
    onSuccess: onSuccess(texts.cosmetics.lookBought, lookItems),
    onError,
  });
  const equip = useMutation({
    mutationFn: (id: string) => lojaApi.equip(id),
    onSuccess: onSuccess(texts.cosmetics.equipped, (id) => [id]),
    onError,
  });
  const unequip = useMutation({
    mutationFn: (id: string) => lojaApi.unequip(id),
    onSuccess: onSuccess(texts.cosmetics.unequipped, (id) => [id]),
    onError,
  });

  const items = useMemo(
    (): CosmeticShopItem[] | undefined =>
      catalog.data?.map((item): CosmeticShopItem => ({
        ...item,
        priceLabel: formatFaisca(item.priceMf),
      })),
    [catalog.data],
  );
  const shopCollections = useMemo((): CosmeticShopCollection[] | undefined => {
    if (!collections.data) return undefined;
    return collections.data.map((collection): CosmeticShopCollection => ({
      ...collection,
      looks: collection.looks.map((look): CosmeticShopLook => ({
        ...look,
        priceLabel: formatFaisca(lookPriceMf(look, itemsById)),
      })),
    }));
  }, [itemsById, collections.data]);

  return (
    <CosmeticShopView
      items={items}
      collections={shopCollections}
      user={me ? profileCardData(me) : { name: "" }}
      loading={catalog.isPending || collections.isPending}
      error={catalog.isError || collections.isError}
      onRetry={() => {
        void catalog.refetch();
        void collections.refetch();
      }}
      actionPending={buy.isPending || buyLook.isPending || equip.isPending || unequip.isPending}
      onBuy={(id) => buy.mutate(id)}
      onBuyLook={(id) => buyLook.mutate(id)}
      onEquip={(id) => equip.mutate(id)}
      onUnequip={(id) => unequip.mutate(id)}
      renderCollectionExtra={(id) => (DUEL_COLLECTIONS.has(id) ? <SaciDuelPanel /> : null)}
    />
  );
}
