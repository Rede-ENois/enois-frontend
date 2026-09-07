import { useState } from "react";

import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Clock, Link as LinkIcon, Star, ThumbsUp, Trophy } from "lucide-react";

import { rankingApi } from "@/lib/api/ranking";
import { recommendationsApi } from "@/lib/api/recommendations";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileRecommendationItem } from "@/components/profile-recommendation-item";
import { ProfileSection } from "@/components/profile-section";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileSidebar({ user }: ProfileSidebarProps) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");
  const isOwnProfile = me?.id === user.id;

  const { data: rankingData } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => rankingApi.list(10),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => recommendationsApi.listReceived(user.id),
  });

  const recommend = useMutation({
    mutationFn: () => recommendationsApi.create(user.id, { comment: recommendComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setRecommendOpen(false);
      setRecommendComment("");
    },
  });

  return (
    <aside className="space-y-6">
      <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
        <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
          {user.availability ?? texts.profile.availabilityUnknown}
        </p>
      </ProfileSection>

      {!isOwnProfile && (
        <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
          <p className="mb-3 text-[13px] font-light text-text-subtle">
            {texts.profile.recommendDescription}
          </p>
          <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
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
                  value={recommendComment}
                  onChange={(event) => setRecommendComment(event.target.value)}
                  placeholder={texts.profile.recommendPlaceholder}
                  rows={3}
                  className="border-border-soft bg-surface-1 text-[13px] font-light"
                />
                <Button
                  size="sm"
                  className="w-full rounded-full"
                  disabled={!recommendComment.trim() || recommend.isPending}
                  onClick={() => recommend.mutate()}
                >
                  {recommend.isPending ? texts.common.sending : texts.profile.sendRecommendation}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </ProfileSection>
      )}

      {recommendationsData && recommendationsData.length > 0 && (
        <ProfileSection title={texts.profile.sections.recommendations} icon={Star}>
          <div className="space-y-3">
            {recommendationsData.map((recommendation) => (
              <ProfileRecommendationItem key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </ProfileSection>
      )}

      {rankingData && rankingData.length > 0 && (
        <ProfileSection title={texts.profile.sections.ranking} icon={Trophy}>
          <div className="space-y-2">
            {rankingData.slice(0, 5).map((rankedUser, index) => (
              <div key={rankedUser.id} className="flex items-center gap-3">
                <span
                  className={`w-5 text-center text-[13px] font-light ${
                    index < 3 ? "text-opportunity" : "text-text-subtle"
                  }`}
                >
                  {texts.profile.rankingPosition(index + 1)}
                </span>
                <Link to="/perfil/$username" params={{ username: rankedUser.username }}>
                  <UserAvatar
                    src={rankedUser.avatar}
                    alt={rankedUser.name}
                    className="h-8 w-8 shrink-0"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/perfil/$username"
                    params={{ username: rankedUser.username }}
                    className="truncate text-[13px] font-light text-text-strong hover:underline"
                  >
                    {rankedUser.name}
                  </Link>
                </div>
                <span className="text-[11px] font-light text-opportunity-foreground">
                  {rankedUser.reputation}
                </span>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {user.externalLinks.length > 0 && (
        <ProfileSection title={texts.profile.sections.links}>
          <ul className="space-y-2 text-[13px] font-light">
            {user.externalLinks.map((link) => (
              <li key={link} className="flex items-center gap-2 text-text-subtle">
                <LinkIcon className="h-4 w-4" />
                <span className="truncate text-text-strong">{link}</span>
              </li>
            ))}
          </ul>
        </ProfileSection>
      )}
    </aside>
  );
}
