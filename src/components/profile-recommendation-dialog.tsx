import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useProfileRecommendationStore } from "@/stores/profile-recommendation.store";
import { texts } from "@/texts";
import type { ProfileRecommendationDialogProps } from "@/types/components/profile/profile-recommendation-dialog-props";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ProfileRecommendationForm } from "@/components/profile-recommendation-form";
import { ProfileRecommendationTrigger } from "@/components/profile-recommendation-trigger";

export function ProfileRecommendationDialog({ user }: ProfileRecommendationDialogProps) {
  const open = useProfileRecommendationStore(
    (state) => state.open && state.targetUserId === user.id,
  );
  const openForUser = useProfileRecommendationStore((state) => state.openForUser);
  const close = useProfileRecommendationStore((state) => state.close);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? openForUser(user.id) : close())}>
      <DialogTrigger asChild>
        <ProfileRecommendationTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.profile.recommendTitle(user.name)}</DialogTitle>
        </DialogHeader>

        <ProfileRecommendationForm />
      </DialogContent>
    </Dialog>
  );
}
