import { texts } from "@/texts";
import type { ProfileRecommendationFormProps } from "@/types/components/profile/profile-recommendation-form-props";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProfileRecommendationForm({
  comment,
  onCommentChange,
  sending,
  sendDisabled,
  onSend,
}: ProfileRecommendationFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <Textarea
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        placeholder={texts.profile.recommendPlaceholder}
        rows={3}
        className="border-border-soft bg-surface-1 text-[13px] font-light"
      />

      <Button size="sm" className="w-full rounded-full" disabled={sendDisabled} onClick={onSend}>
        {sending ? texts.common.sending : texts.profile.sendRecommendation}
      </Button>
    </div>
  );
}
