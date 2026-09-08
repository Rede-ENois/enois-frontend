import { texts } from "@/texts";
import { useProfileRecommendationFormController } from "@/utils/components/profile/use-profile-recommendation-form-controller";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProfileRecommendationForm() {
  const controller = useProfileRecommendationFormController();

  return (
    <div className="space-y-4 pt-2">
      <Textarea
        value={controller.comment}
        onChange={controller.handleCommentChange}
        placeholder={texts.profile.recommendPlaceholder}
        rows={3}
        className="border-border-soft bg-surface-1 text-[13px] font-light"
      />

      <Button
        size="sm"
        className="w-full rounded-full"
        disabled={controller.sendDisabled}
        onClick={controller.send}
      >
        {controller.sendLabel}
      </Button>
    </div>
  );
}
