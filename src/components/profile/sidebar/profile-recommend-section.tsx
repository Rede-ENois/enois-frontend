import { ThumbsUp } from "lucide-react";

import type { Profile } from "@/lib/api";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ProfileSection } from "../profile-section";

export function ProfileRecommendSection({ user, open, comment, pending, onOpenChange, onCommentChange, onSubmit }: {
  user: Profile;
  open: boolean;
  comment: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">{texts.profile.recommendDescription}</p>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full rounded-full gap-1.5"><ThumbsUp className="h-4 w-4" /> {texts.profile.recommendAction}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-light">{texts.profile.recommendTitle(user.name)}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder={texts.profile.recommendPlaceholder} rows={3} className="border-border-soft bg-surface-1 text-[13px] font-light" />
            <Button size="sm" className="w-full rounded-full" disabled={!comment.trim() || pending} onClick={onSubmit}>
              {pending ? texts.common.sending : texts.profile.sendRecommendation}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProfileSection>
  );
}
