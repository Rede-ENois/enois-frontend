import { Link } from "@tanstack/react-router";

import { Clock, Link as LinkIcon, Star, ThumbsUp, Trophy } from "lucide-react";

import type { Profile, RankingUser, Recommendation } from "@/lib/api";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ProfileSection } from "./profile-section";

type ProfileSidebarProps = {
  user: Profile;
  isOwnProfile: boolean;
  recommendations: Recommendation[];
  recommenders: Record<string, Profile>;
  ranking: RankingUser[];
  recommendationOpen: boolean;
  recommendationComment: string;
  recommendationPending: boolean;
  onRecommendationOpenChange: (open: boolean) => void;
  onRecommendationCommentChange: (value: string) => void;
  onRecommendationSubmit: () => void;
};

export function ProfileSidebar({
  user,
  isOwnProfile,
  recommendations,
  recommenders,
  ranking,
  recommendationOpen,
  recommendationComment,
  recommendationPending,
  onRecommendationOpenChange,
  onRecommendationCommentChange,
  onRecommendationSubmit,
}: ProfileSidebarProps) {
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
          <Dialog open={recommendationOpen} onOpenChange={onRecommendationOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full rounded-full gap-1.5">
                <ThumbsUp className="h-4 w-4" /> {texts.profile.recommendAction}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-light">{texts.profile.recommendTitle(user.name)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Textarea
                  value={recommendationComment}
                  onChange={(event) => onRecommendationCommentChange(event.target.value)}
                  placeholder={texts.profile.recommendPlaceholder}
                  rows={3}
                  className="border-border-soft bg-surface-1 text-[13px] font-light"
                />
                <Button
                  size="sm"
                  className="w-full rounded-full"
                  disabled={!recommendationComment.trim() || recommendationPending}
                  onClick={onRecommendationSubmit}
                >
                  {recommendationPending ? texts.common.sending : texts.profile.sendRecommendation}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </ProfileSection>
      )}

      {recommendations.length > 0 && (
        <ProfileSection title={texts.profile.sections.recommendations} icon={Star}>
          <div className="space-y-3">
            {recommendations.map((recommendation) => {
              const recommender = recommenders[recommendation.recommenderId];
              return (
                <div key={recommendation.id} className="rounded-xl bg-surface-1 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />
                    <span className="text-[12px] font-medium text-text-strong">
                      {recommender?.name ?? texts.profile.userFallback}
                    </span>
                  </div>
                  <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
                    “{recommendation.comment}”
                  </p>
                </div>
              );
            })}
          </div>
        </ProfileSection>
      )}

      {ranking.length > 0 && (
        <ProfileSection title={texts.profile.sections.ranking} icon={Trophy}>
          <div className="space-y-2">
            {ranking.slice(0, 5).map((rankedUser, index) => (
              <div key={rankedUser.id} className="flex items-center gap-3">
                <span className={`w-5 text-center text-[13px] font-light ${index < 3 ? "text-opportunity" : "text-text-subtle"}`}>
                  {index + 1}º
                </span>
                <Link to="/perfil/$username" params={{ username: rankedUser.username }}>
                  <UserAvatar src={rankedUser.avatar} alt={rankedUser.name} className="h-8 w-8 shrink-0" />
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
                <span className="text-[11px] font-light text-opportunity-foreground">{rankedUser.reputation}</span>
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
