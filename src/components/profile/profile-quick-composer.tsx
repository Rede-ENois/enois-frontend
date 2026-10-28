import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileQuickComposerProps } from "@/types/components/profile/profile-quick-composer-props";
import { ProfileQuickComposer as ProfileQuickComposerView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { feedApi } from "@/lib/api";

export function ProfileQuickComposer({ profile }: ProfileQuickComposerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const publish = useMutation({
    mutationFn: (content: string) => feedApi.create({ type: "INSIGHT", content }),
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
      publishPending={publish.isPending}
      onPublish={async (content) => {
        try {
          await publish.mutateAsync(content);
          return true;
        } catch {
          return false;
        }
      }}
    />
  );
}
