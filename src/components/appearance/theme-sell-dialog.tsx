import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePreferencesStore } from "@/stores/preferences.store";
import {
  ThemeSellDialog as ThemeSellDialogView,
  type ThemeSellValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, marketplaceApi, themesApi } from "@/lib/api";
import { formatFaisca, parseFaiscaInput } from "@/lib/faisca";
import { buildGalleryPackage } from "@/lib/theme/gallery-package";
import { resolveThemeCollection } from "@/lib/theme/resolve-theme-collection";

/**
 * "Vender no marketplace" da APARÊNCIA ATUAL.
 *
 * O marketplace não vende só tema de coleção: vende a personalização como um pacote de cores —
 * a coleção ativa, o destaque livre e o fundo de página entram nos mesmos cinco pares de cor da
 * galeria. O fluxo é um só: publica o pacote na galeria (o que o comprador instala) e já o lista
 * à venda em faíscas. Quem compra recebe o tema pela galeria e pode exportar o arquivo
 * `.enois-theme` como qualquer outro.
 */
export function ThemeSellDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const theme = usePreferencesStore((state) => state.theme);
  const collectionId = usePreferencesStore((state) => state.themeCollection);
  const settings = usePreferencesStore((state) => state.themeSettings);
  const pageBackground = usePreferencesStore((state) => state.pageBackground);

  const activeCollection = resolveThemeCollection(collectionId);

  const sell = useMutation({
    mutationFn: async ({ name, description, price }: ThemeSellValues) => {
      const cleanName = name.trim();
      const cleanDescription = description.trim() || undefined;
      // 1) o pacote da aparência atual entra na galeria (é ele que o comprador instala);
      const galleryPackage = buildGalleryPackage({
        collectionId,
        settings,
        mode: theme,
        page: pageBackground,
      });
      const published = await themesApi.publish({
        name: cleanName,
        description: cleanDescription,
        packageJson: galleryPackage.packageJson,
        modeDefault: galleryPackage.modeDefault,
      });
      // 2) e a listagem do marketplace aponta para esse tema.
      return marketplaceApi.publish({
        itemId: published.id,
        title: cleanName,
        description: cleanDescription,
        price: parseFaiscaInput(price) ?? 0,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      void queryClient.invalidateQueries({ queryKey: ["theme-gallery"] });
      toast("Publicado na galeria e à venda no marketplace!", "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(
        error instanceof ApiError ? error.message : "Não foi possível vender agora. Tente de novo.",
        "error",
      ),
  });

  return (
    <ThemeSellDialogView
      open={open}
      onOpenChange={onOpenChange}
      defaultName={activeCollection?.name ?? ""}
      parsePrice={parseFaiscaInput}
      formatPrice={formatFaisca}
      pending={sell.isPending}
      onSubmit={(values) => sell.mutate(values)}
    />
  );
}
