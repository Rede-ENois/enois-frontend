import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CatalogOrder } from "@/types/application/loja/catalog-order";
import type { FrameShopProps } from "@/types/components/wallet/frame-shop-props";
import { FrameShop as FrameShopView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { lojaApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { formatFaisca } from "@/lib/faisca";

export function FrameShop({ onlyOwned = false }: FrameShopProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const [order, setOrder] = useState<CatalogOrder>("oldest");
  const catalog = useQuery({ queryKey: ["loja", order], queryFn: () => lojaApi.catalog(order) });
  const buy = useMutation({
    mutationFn: (id: string) => lojaApi.buy(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["loja"] });
      void queryClient.invalidateQueries({ queryKey: ["carteira"] });
      toast(texts.frameShop.bought, "success");
    },
    onError: () => toast(texts.frameShop.buyError, "error"),
  });
  const equip = useMutation({
    mutationFn: (id: string) => lojaApi.equip(id),
    onSuccess: () => {
      for (const key of ["loja", "profile", "me", "feed"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: () => toast(texts.frameShop.equipError, "error"),
  });

  return (
    <FrameShopView
      onlyOwned={onlyOwned}
      items={catalog.data
        ?.filter((item): boolean => item.kind === "FRAME")
        .map((item) => ({ ...item, priceLabel: formatFaisca(item.priceMf) }))}
      loading={catalog.isPending}
      error={catalog.isError}
      onRetry={() => void catalog.refetch()}
      user={user}
      order={order}
      onOrderChange={setOrder}
      actionPending={buy.isPending || equip.isPending}
      onBuy={(id) => buy.mutate(id)}
      onEquip={(id) => equip.mutate(id)}
    />
  );
}
