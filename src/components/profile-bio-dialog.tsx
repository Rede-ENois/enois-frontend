import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { PROFILE_HTML_MAX_LENGTH } from "@/constants/profile";
import { texts } from "@/texts";
import type { ProfileBioDialogProps } from "@/types/components/profile/profile-bio-dialog-props";
import { ProfileBioDialog as ProfileBioDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { profileApi } from "@/lib/api";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Bio do perfil em HTML/CSS.
 *
 * Deixar vazio é uma ação legítima: limpa o HTML e o perfil volta a mostrar a bio de texto — por
 * isso o botão de limpar existe, em vez de o campo "não deixar" apagar.
 */
export function ProfileBioDialog({ initialHtml, onSaved }: ProfileBioDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: (html: string) => profileApi.update({ bioHtml: html }),
    onSuccess: () => {
      setOpen(false);
      toast(texts.profile.bioHtml.saved);
      onSaved();
    },
    onError: () => toast(texts.profile.bioHtml.error, "error"),
  });

  return (
    <ProfileBioDialogView
      open={open}
      onOpenChange={setOpen}
      initialHtml={initialHtml}
      maxLength={PROFILE_HTML_MAX_LENGTH}
      savePending={save.isPending}
      onSave={(html) => save.mutate(html)}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
