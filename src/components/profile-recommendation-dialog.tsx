import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { texts } from "@/texts";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";
import { useProfileRecommendationDialogController } from "@/utils/components/profile/use-profile-recommendation-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ProfileRecommendationForm } from "@/components/profile-recommendation-form";
import { ProfileRecommendationTrigger } from "@/components/profile-recommendation-trigger";

export function ProfileRecommendationDialog() {
  const { user } = useProfilePageContext();
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
