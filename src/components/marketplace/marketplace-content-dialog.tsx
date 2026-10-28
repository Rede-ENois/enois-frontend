import { useQuery } from "@tanstack/react-query";

import { MarketplaceContentDialog as MarketplaceContentDialogView } from "@rede-enois/design-system/domain";

import { marketplaceApi } from "@/lib/api";

/**
 * Conteúdo de uma compra: o comprador edita os textos aqui mesmo e copia o HTML.
 *
 * A edição é local (o material comprado não muda no servidor): o objetivo é adaptar o template
 * antes de colar no perfil, no post, na página ou no blog.
 */
export function MarketplaceContentDialog({
  purchaseId,
  title,
  onClose,
}: {
  purchaseId: string;
  title: string | null | undefined;
  onClose: () => void;
}) {
  const content = useQuery({
    queryKey: ["marketplace", "purchase-content", purchaseId],
    queryFn: () => marketplaceApi.purchaseContent(purchaseId),
  });

  return (
    <MarketplaceContentDialogView
      title={title}
      data={content.data}
      loading={content.isLoading}
      error={content.isError}
      onClose={onClose}
    />
  );
}
