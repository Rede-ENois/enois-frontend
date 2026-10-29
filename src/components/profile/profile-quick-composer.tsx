import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileQuickComposerProps } from "@/types/components/profile/profile-quick-composer-props";
import type { ProfileQuickComposerPublishPayload } from "@rede-enois/design-system/domain";
import { ProfileQuickComposer as ProfileQuickComposerView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { feedApi } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";

export function ProfileQuickComposer({ profile }: ProfileQuickComposerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const upload = useMediaUpload();

  const publish = useMutation({
    mutationFn: (data: { content: string; mediaIds: string[]; mediaSpoiler: boolean }) =>
      feedApi.create({
        type: "INSIGHT",
        content: data.content,
        mediaIds: data.mediaIds,
        mediaSpoiler: data.mediaSpoiler,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed", "user", profile.id] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast(texts.profile.dashboard.composer.success, "success");
    },
    onError: () => toast(texts.profile.dashboard.composer.error, "error"),
  });

  return (
    <ProfileQuickComposerView
      profile={profile}
      publishPending={publish.isPending || upload.status === "uploading"}
      uploadProgress={
        upload.status === "uploading" ? texts.feed.composer.uploadProgress(upload.progress) : null
      }
      onPublish={async (payload: ProfileQuickComposerPublishPayload) => {
        let mediaIds: string[] = [];
        if (payload.files.length > 0) {
          try {
            const results = await upload.uploadAll(payload.files.map((file) => ({ file })));
            mediaIds = results.map((r) => r.mediaId);
          } catch (err) {
            // Sem isto a falha do envio sumia e a pessoa ficava num composer de texto, sem saber por quê.
            toast(
              err instanceof Error && err.message
                ? err.message
                : texts.profile.dashboard.composer.error,
              "error",
            );
            return false;
          }
        }
        try {
          await publish.mutateAsync({
            content: payload.content,
            mediaIds,
            mediaSpoiler: payload.mediaSpoiler,
          });
          return true;
        } catch {
          // O toast de erro da publicação já sai no onError da mutation.
          return false;
        }
      }}
    />
  );
}
