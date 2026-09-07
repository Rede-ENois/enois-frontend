import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Trophy } from "lucide-react";

import { useProfileRankingController } from "@/utils/components/profile/use-profile-ranking-controller";

import { ProfileSection } from "@/components/profile-section";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileRankingSection() {
  const { visible, items } = useProfileRankingController();

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.ranking} icon={Trophy}>
      <div className="space-y-2">
        {items.map(({ rankedUser, positionLabel, highlighted }) => (
          <div key={rankedUser.id} className="flex items-center gap-3">
            <span
              className={`w-5 text-center text-[13px] font-light ${
                highlighted ? "text-opportunity" : "text-text-subtle"
              }`}
            >
              {positionLabel}
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
  );
}
