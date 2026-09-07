import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { ThumbsUp } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileRecommendationDialogProps } from "@/types/components/profile/profile-recommendation-dialog-props";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Textarea } from "@/components/ui/textarea";

export function ProfileRecommendationDialog({
  userName,
  open,
  onOpenChange,
  comment,
  onCommentChange,
  sending,
  sendDisabled,
  onSend,
}: ProfileRecommendationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full rounded-full gap-1.5">
          <ThumbsUp className="h-4 w-4" />

          <>{texts.profile.recommendAction}</>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.profile.recommendTitle(userName)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={comment}
            onChange={(event) => onCommentChange(event.target.value)}
            placeholder={texts.profile.recommendPlaceholder}
            rows={3}
            className="border-border-soft bg-surface-1 text-[13px] font-light"
          />

          <Button
            size="sm"
            className="w-full rounded-full"
            disabled={sendDisabled}
            onClick={onSend}
          >
            {sending ? texts.common.sending : texts.profile.sendRecommendation}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
