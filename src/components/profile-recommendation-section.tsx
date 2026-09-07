import { useState } from "react";

import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ThumbsUp } from "lucide-react";

import { createRecommendation } from "@/lib/api/recommendations/create-recommendation";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileSection } from "@/components/profile-section";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Textarea } from "@/components/ui/textarea";

export function ProfileRecommendationSection({ user }: ProfileSidebarProps) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const recommend = useMutation({
    mutationFn: () => createRecommendation(user.id, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setOpen(false);
      setComment("");
    },
  });

  if (me?.id === user.id) return null;

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
              disabled={!comment.trim() || recommend.isPending}
              onClick={() => recommend.mutate()}
            >
              {recommend.isPending ? texts.common.sending : texts.profile.sendRecommendation}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProfileSection>
  );
}
