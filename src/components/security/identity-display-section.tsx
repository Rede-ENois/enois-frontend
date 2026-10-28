import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  IdentitySection as IdentitySectionView,
  type IdentityValues,
  MAX_BADGES,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { preferencesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { useMediaUpload } from "@/lib/use-media-upload";

import { BadgeMediaProvider } from "@/components/badge-media-provider";

/**
 * Nome e identidade: nome social (substitui o de cadastro para todo mundo), apelido
 * (entra entre parênteses depois do nome), pronomes (só no perfil) e até 5 emblemas
 * (o primeiro acompanha o nome por todo o app; todos aparecem no perfil). O nome de
 * cadastro continua existindo para o dono da conta e para a empresa que recebe a
 * candidatura — que vê os dois nomes, um abaixo do outro.
 */
export function IdentitySection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const badgeUpload = useMediaUpload();

  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!me) return;
    setBadges(me.badges ?? (me.badge ? [me.badge] : []));
  }, [me]);

  const saveIdentity = useMutation({
    mutationFn: ({ socialName, nickname, pronouns }: IdentityValues) =>
      preferencesApi.setIdentity({
        socialName: socialName.trim() || null,
        nickname: nickname.trim() || null,
        pronouns: pronouns.trim() || null,
      }),
    onSuccess: () => {
      toast(texts.account.identity.saved);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast(texts.account.identity.error, "error"),
  });

  const saveBadges = useMutation({
    mutationFn: (next: string[]) => preferencesApi.setBadges(next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast(texts.account.identity.error, "error"),
  });

  const addBadge = async (file: File) => {
    if (badges.length >= MAX_BADGES) {
      toast(texts.account.identity.badgesFull, "error");
      return;
    }
    try {
      const result = await badgeUpload.upload(file, "BADGE");
      const next = [...badges, result.cdnUrl];
      setBadges(next);
      await saveBadges.mutateAsync(next);
    } catch {
      toast(texts.profile.imageUploadError, "error");
    }
  };

  const removeBadge = async (url: string) => {
    const next = badges.filter((badge) => badge !== url);
    setBadges(next);
    await saveBadges.mutateAsync(next);
  };

  return (
    <BadgeMediaProvider badges={badges}>
      <IdentitySectionView
        identity={me}
        onSave={(values) => saveIdentity.mutate(values)}
        savePending={saveIdentity.isPending}
        badges={badges}
        onAddBadge={(file) => void addBadge(file)}
        onRemoveBadge={(url) => void removeBadge(url)}
        badgesPending={saveBadges.isPending}
        uploading={badgeUpload.status === "uploading"}
      />
    </BadgeMediaProvider>
  );
}
