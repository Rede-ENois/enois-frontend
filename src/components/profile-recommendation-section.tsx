import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";
import { ThumbsUp } from "lucide-react";

import { useProfileRecommendationController } from "@/utils/components/profile/use-profile-recommendation-controller";

import { ProfileRecommendationDialog } from "@/components/profile-recommendation-dialog";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationSection({ user }: ProfileSidebarProps) {
  const controller = useProfileRecommendationController(user);

  if (!controller.visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">
        {texts.profile.recommendDescription}
      </p>

      <ProfileRecommendationDialog
        userName={user.name}
        open={controller.open}
        onOpenChange={controller.setOpen}
        comment={controller.comment}
        onCommentChange={controller.setComment}
        sending={controller.sending}
        sendDisabled={controller.sendDisabled}
        onSend={controller.send}
      />
    </ProfileSection>
  );
}
