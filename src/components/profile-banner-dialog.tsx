import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PROFILE_HTML_MAX_LENGTH } from "@/constants/profile";
import { texts } from "@/texts";
import type { ProfileBannerDialogProps } from "@/types/components/profile/profile-banner-dialog-props";
import { ProfileBannerDialog as ProfileBannerDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { lojaApi, profileApi } from "@/lib/api";
import { cosmeticErrorMessage, invalidateCosmetics } from "@/lib/cosmetics";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Capa do perfil: foto OU HTML/CSS, sempre com as duas opções na mão.
 *
 * A capa em HTML ocupa exatamente o mesmo espaço da foto (a altura da capa, não uma caixa própria) —
 * é o que o editor já mostra na pré-visualização, para ninguém descobrir o recorte depois de salvar.
 */
export function ProfileBannerDialog({
  open,
  onOpenChange,
  initialHtml,
  onPickPhoto,
  onSaved,
  bannerItem = null,
}: ProfileBannerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Same query as the shop: only read when a shop banner is on, for its display name.
  const catalog = useQuery({
    queryKey: ["loja", "oldest"],
    queryFn: () => lojaApi.catalog(),
    enabled: open && bannerItem !== null,
  });
  const shopBanner = bannerItem
    ? (catalog.data?.find((item) => item.id === bannerItem)?.name ?? bannerItem)
    : null;

  const save = useMutation({
    mutationFn: (value: string) => profileApi.update({ bannerHtml: value }),
    onSuccess: () => {
      onOpenChange(false);
      toast(texts.profile.bannerHtml.saved);
      onSaved();
    },
    onError: () => toast(texts.profile.bannerHtml.error, "error"),
  });
  const ownCover = useMutation({
    mutationFn: (id: string) => lojaApi.unequip(id),
    onSuccess: () => {
      onOpenChange(false);
      invalidateCosmetics(queryClient);
      toast(texts.cosmetics.unequipped, "success");
      onSaved();
    },
    onError: (error) => toast(cosmeticErrorMessage(error), "error"),
  });

  return (
    <ProfileBannerDialogView
      open={open}
      onOpenChange={onOpenChange}
      initialHtml={initialHtml}
      onPickPhoto={onPickPhoto}
      maxLength={PROFILE_HTML_MAX_LENGTH}
      savePending={save.isPending || ownCover.isPending}
      onSave={(value) => save.mutate(value)}
      shopBanner={shopBanner}
      onUseOwnCover={bannerItem ? () => ownCover.mutate(bannerItem) : undefined}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
