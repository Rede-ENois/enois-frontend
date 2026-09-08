import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { texts } from "@/texts";
import type { ProfileRecommendationDialogProps } from "@/types/components/profile/profile-recommendation-dialog-props";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ProfileRecommendationForm } from "@/components/profile-recommendation-form";
import { ProfileRecommendationTrigger } from "@/components/profile-recommendation-trigger";

export function ProfileRecommendationDialog(props: ProfileRecommendationDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>
        <ProfileRecommendationTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">
            {texts.profile.recommendTitle(props.userName)}
          </DialogTitle>
        </DialogHeader>

        <ProfileRecommendationForm
          comment={props.comment}
          onCommentChange={props.onCommentChange}
          sending={props.sending}
          sendDisabled={props.sendDisabled}
          onSend={props.onSend}
        />
      </DialogContent>
    </Dialog>
  );
}
