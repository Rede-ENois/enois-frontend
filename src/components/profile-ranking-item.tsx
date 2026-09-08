import { Link } from "@tanstack/react-router";

import type { ProfileRankingItemProps } from "@/types/components/profile/profile-ranking-item-props";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileRankingItem({
  rankedUser,
  positionLabel,
  highlighted,
}: ProfileRankingItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-5 text-center text-[13px] font-light ${
          highlighted ? "text-opportunity" : "text-text-subtle"
        }`}
      >
        {positionLabel}
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

      <span className="text-[11px] font-light text-opportunity-foreground">
        {rankedUser.reputation}
      </span>
    </div>
  );
}
