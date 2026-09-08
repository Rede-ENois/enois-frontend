import { texts } from "@/texts";
import type { ProfileRecommendationDialogProps } from "@/types/components/profile/profile-recommendation-dialog-props";
import { useProfileRecommendationDialogController } from "@/utils/components/profile/use-profile-recommendation-dialog-controller";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ProfileRecommendationForm } from "@/components/profile-recommendation-form";
import { ProfileRecommendationTrigger } from "@/components/profile-recommendation-trigger";

export function ProfileRecommendationDialog({ user }: ProfileRecommendationDialogProps) {
  const controller = useProfileRecommendationDialogController(user.id);

  return (
    <Dialog open={controller.open} onOpenChange={controller.handleOpenChange}>
      <DialogTrigger asChild>
        <ProfileRecommendationTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">
            {texts.profile.recommendTitle(user.name)}
          </DialogTitle>
        </DialogHeader>

        <ProfileRecommendationForm />
      </DialogContent>
    </Dialog>
  );
}
