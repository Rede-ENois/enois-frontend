import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProfileAppearance } from "@/types/application/profile/profile-appearance";
import { toProfileAppearance } from "@/types/application/profile/profile-appearance";
import { ProfileLookDialog as ProfileLookDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { profileApi } from "@/lib/api";

/**
 * Aparência da vitrine: os dois lados do perfil (social e profissional) com o tema e os
 * ajustes finos de cada um.
 *
 * Diferente do diálogo do tema da conta: aquela escolha é de QUEM OLHA e vale neste
 * dispositivo (e na conta, como preferência); esta é de QUEM É OLHADO e acompanha o perfil,
 * então é uma escrita no servidor e sem isso não tem efeito para ninguém.
 *
 * `onPreview` recebe o documento em edição para a página do perfil se vestir com ele antes de
 * salvar — a prévia acontece sobre os elementos reais da página, não numa miniatura. Fechar
 * sem salvar devolve o que estava gravado (o chamador limpa a prévia).
 */
export function ProfileLookDialog({
  open,
  onOpenChange,
  value,
  onPreview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProfileAppearance;
  onPreview: (next: ProfileAppearance | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProfileAppearance>(value);

  useEffect(() => {
    if (open) setDraft(toProfileAppearance(value));
  }, [open, value]);

  const save = useMutation({
    mutationFn: (next: ProfileAppearance) => profileApi.setProfileAppearance(next),
    onSuccess: (saved) => {
      // A gravação volta do servidor limpa (é ele que valida): o cache usa o documento salvo,
      // não o rascunho, para tela e próxima abertura contarem a mesma história.
      queryClient.setQueryData(["me"], (previous: unknown) =>
        previous && typeof previous === "object"
          ? { ...previous, profileAppearance: saved, profileLook: saved.social }
          : previous,
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onPreview(null);
      onOpenChange(false);
    },
    onError: () => {
      // O rascunho fica na tela: erro de servidor não pode apagar o que a pessoa escolheu.
      toast("Não foi possível salvar a aparência do perfil.", "error");
    },
  });

  return (
    <ProfileLookDialogView
      open={open}
      onOpenChange={(next) => {
        if (!next) onPreview(null);
        onOpenChange(next);
      }}
      value={draft}
      onDraftChange={(next) => {
        setDraft(next);
        onPreview(next);
      }}
      onSave={(next) => {
        setDraft(next);
        save.mutate(next);
      }}
      saving={save.isPending}
    />
  );
}
