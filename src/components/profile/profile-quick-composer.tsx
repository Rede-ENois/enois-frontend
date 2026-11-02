import { useNavigate } from "@tanstack/react-router";

import type { ProfileQuickComposerProps } from "@/types/components/profile/profile-quick-composer-props";
import { ProfileQuickComposer as ProfileQuickComposerView } from "@rede-enois/design-system/domain";

import { handOffComposerFiles } from "@/lib/composer-handoff";

/**
 * The profile composer only launches the feed composer: publishing there is what asks for the post
 * type and topic, so a post started on the profile lands in the right feed filters.
 */
export function ProfileQuickComposer({ profile }: ProfileQuickComposerProps) {
  const navigate = useNavigate();

  return (
    <ProfileQuickComposerView
      profile={profile}
      onCompose={() => void navigate({ to: "/feed" })}
      onComposeWithMedia={(files) => {
        handOffComposerFiles(files);
        void navigate({ to: "/feed", search: { compor: "MEDIA" } });
      }}
      onWriteArticle={() => void navigate({ to: "/feed", search: { compor: "ARTICLE" } })}
    />
  );
}
