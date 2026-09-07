import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { ThumbsUp } from "lucide-react";

import { useProfileRecommendationController } from "@/lib/use-profile-recommendation-controller";
import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileSection } from "@/components/profile-section";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Textarea } from "@/components/ui/textarea";

export function ProfileRecommendationSection({ user }: ProfileSidebarProps) {
  const { visible, open, setOpen, comment, setComment, sending, send } =
    useProfileRecommendationController(user);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">
        {texts.profile.recommendDescription}
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full rounded-full gap-1.5">
            <ThumbsUp className="h-4 w-4" /><>{texts.profile.recommendAction}</>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-light">{texts.profile.recommendTitle(user.name)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={texts.profile.recommendPlaceholder}
              rows={3}
              className="border-border-soft bg-surface-1 text-[13px] font-light"
            />
            <Button
              size="sm"
              className="w-full rounded-full"
              disabled={!comment.trim() || sending}
              onClick={send}
            >
              {sending ? texts.common.sending : texts.profile.sendRecommendation}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProfileSection>
  );
}
