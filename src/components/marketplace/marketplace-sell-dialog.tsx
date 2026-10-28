import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CONTENT_KINDS, MARKETPLACE_KIND_LABELS } from "@/constants/marketplace-kinds";
import type { MarketplaceKind } from "@/types/application/marketplace/marketplace-kind";
import {
  MarketplaceSellDialog as MarketplaceSellDialogView,
  type MarketplaceSellValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, marketplaceApi } from "@/lib/api";
import { parseFaiscaInput } from "@/lib/faisca";

const KIND_OPTIONS = CONTENT_KINDS.map((value) => [value, MARKETPLACE_KIND_LABELS[value]] as const);

/**
 * Vender qualquer conteúdo por faíscas: template, banner, página, post, blog ou serviço.
 * O comprador recebe o texto/HTML em "Minhas compras" e edita antes de usar.
 */
export function MarketplaceSellDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const publish = useMutation({
    mutationFn: (values: MarketplaceSellValues) =>
      marketplaceApi.publishItem({
        kind: values.kind as MarketplaceKind,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        content: values.content,
        price: parseFaiscaInput(values.price) ?? 0,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast("Publicado no marketplace!", "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(
        error instanceof ApiError ? error.message : "Não foi possível publicar agora.",
        "error",
      ),
  });

  return (
    <MarketplaceSellDialogView
      open={open}
      onOpenChange={onOpenChange}
      kindOptions={KIND_OPTIONS}
      parsePrice={parseFaiscaInput}
      pending={publish.isPending}
      onSubmit={(values) => publish.mutate(values)}
    />
  );
}
