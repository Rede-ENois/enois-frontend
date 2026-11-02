import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { LojaItem } from "@/types/application/loja/loja-item";
import type { CosmeticKind, CosmeticShopItem } from "@rede-enois/design-system/domain";
import { COSMETIC_KINDS, CosmeticItemArt } from "@rede-enois/design-system/domain";
import { Button, LoadingState, useToast } from "@rede-enois/design-system/ui";

import { lojaApi } from "@/lib/api";
import { cosmeticErrorMessage, invalidateCosmetics, profileCardData } from "@/lib/cosmetics";
import { useCurrentUser } from "@/lib/current-user";

const myItems = texts.frameShop.myItems;

/**
 * Everything the person already bought, in one place: what is on the profile today (the
 * "ativos", each one equipment away from being swapped) sits on top, and the rest follows
 * grouped by the slot it fills — frames, badges, card themes, names, plates, banners, effects and
 * gardens — the same subcategories the shop sells in.
 */
export function OwnedItems({ onGoToStore }: { onGoToStore?: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  // Same query key as the shop: the catalog comes with `owned`/`equipped` for this session.
  const catalog = useQuery({ queryKey: ["loja", "oldest"], queryFn: () => lojaApi.catalog() });
  const equip = useMutation({
    mutationFn: (id: string) => lojaApi.equip(id),
    onSuccess: () => {
      invalidateCosmetics(queryClient);
      toast(texts.cosmetics.equipped, "success");
    },
    onError: (error: unknown) => toast(cosmeticErrorMessage(error), "error"),
  });
  const unequip = useMutation({
    mutationFn: (id: string) => lojaApi.unequip(id),
    onSuccess: () => {
      invalidateCosmetics(queryClient);
      toast(texts.cosmetics.unequipped, "success");
    },
    onError: (error: unknown) => toast(cosmeticErrorMessage(error), "error"),
  });

  const owned = useMemo(
    () => (catalog.data ?? []).filter((item): boolean => Boolean(item.owned)),
    [catalog.data],
  );
  const active = owned.filter((item): boolean => Boolean(item.equipped));
  const rest = owned.filter((item): boolean => !item.equipped);
  const groups = COSMETIC_KINDS.map((kind): [CosmeticKind, LojaItem[]] => [
    kind,
    rest.filter((item): boolean => item.kind === kind),
  ]).filter(([, items]) => items.length > 0);
  const preview = me ? profileCardData(me) : { name: "" };
  const pending = equip.isPending || unequip.isPending;

  if (catalog.isPending) return <LoadingState />;
  if (catalog.isError) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-text-subtle">
        <p>{myItems.loadError}</p>

        <Button
          size="sm"
          variant="outline"
          className="mt-3 rounded-full"
          onClick={() => void catalog.refetch()}
        >
          {myItems.retry}
        </Button>
      </div>
    );
  }

  if (owned.length === 0) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-text-subtle">
        <p>{myItems.empty}</p>

        {onGoToStore && (
          <Button size="sm" className="mt-3 rounded-full" onClick={onGoToStore}>
            {myItems.emptyCta}
          </Button>
        )}
      </div>
    );
  }

  const row = (item: LojaItem) => {
    const shopItem: Pick<CosmeticShopItem, "id" | "kind" | "name"> = {
      id: item.id,
      kind: item.kind,
      name: item.name,
    };
    return (
      <li
        key={item.id}
        data-item-id={item.id}
        className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-card p-3"
      >
        <CosmeticItemArt item={shopItem} user={preview} variant="thumb" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-strong">{item.name}</p>

          <p className="text-xs text-text-subtle">{myItems.kinds[item.kind] ?? item.kind}</p>
        </div>

        <Button
          size="sm"
          variant={item.equipped ? "outline" : "default"}
          className="shrink-0 rounded-full"
          disabled={pending}
          onClick={() => (item.equipped ? unequip.mutate(item.id) : equip.mutate(item.id))}
        >
          {item.equipped ? myItems.unequip : myItems.equip}
        </Button>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section aria-labelledby="my-items-active" className="space-y-3">
          <header>
            <h2
              id="my-items-active"
              className="text-sm font-semibold uppercase tracking-widest text-text-subtle"
            >
              {myItems.activeTitle}
            </h2>

            <p className="mt-1 text-xs text-text-subtle">{myItems.activeHint}</p>
          </header>

          <ul className="space-y-2">{active.map(row)}</ul>
        </section>
      )}

      <section aria-labelledby="my-items-owned" className="space-y-4">
        <h2
          id="my-items-owned"
          className="text-sm font-semibold uppercase tracking-widest text-text-subtle"
        >
          {myItems.ownedTitle}
        </h2>

        {groups.map(([kind, items]) => (
          <div key={kind} className="space-y-2">
            <h3 className="text-xs font-medium text-text-strong">
              {myItems.kinds[kind] ?? kind}
              <span className="ml-1.5 font-normal text-text-subtle">{items.length}</span>
            </h3>

            <ul className="space-y-2">{items.map(row)}</ul>
          </div>
        ))}
      </section>
    </div>
  );
}
