import { useMutation } from "@tanstack/react-query";

import { PROFILE_HTML_MAX_LENGTH } from "@/constants/profile";
import { texts } from "@/texts";
import type { ProfileBannerDialogProps } from "@/types/components/profile/profile-banner-dialog-props";
import { ProfileBannerDialog as ProfileBannerDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { profileApi } from "@/lib/api";

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
}: ProfileBannerDialogProps) {
  const { toast } = useToast();

  const save = useMutation({
    mutationFn: (value: string) => profileApi.update({ bannerHtml: value }),
    onSuccess: () => {
      onOpenChange(false);
      toast(texts.profile.bannerHtml.saved);
      onSaved();
    },
    onError: () => toast(texts.profile.bannerHtml.error, "error"),
  });

  return (
    <ProfileBannerDialogView
      open={open}
      onOpenChange={onOpenChange}
      initialHtml={initialHtml}
      onPickPhoto={onPickPhoto}
      maxLength={PROFILE_HTML_MAX_LENGTH}
      savePending={save.isPending}
      onSave={(value) => save.mutate(value)}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
