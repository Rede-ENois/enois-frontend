import { Link } from "@tanstack/react-router";

import { Trophy } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileRankingSectionProps } from "@/types/components/profile/sidebar/profile-ranking-section-props";

import { UserAvatar } from "@/components/user-avatar";
import { ProfileSection } from "../profile-section";

export function ProfileRankingSection({ ranking }: ProfileRankingSectionProps) {
  if (ranking.length === 0) return null;

  return (
    <ProfileSection title={texts.profile.sections.ranking} icon={Trophy}>
      <div className="space-y-2">
        {ranking.slice(0, 5).map((user, index) => (
          <div key={user.id} className="flex items-center gap-3">
            <span className={`w-5 text-center text-[13px] font-light ${index < 3 ? "text-opportunity" : "text-text-subtle"}`}>{index + 1}º</span>
            <Link to="/perfil/$username" params={{ username: user.username }}>
              <UserAvatar src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0" />
            </Link>
            <Link to="/perfil/$username" params={{ username: user.username }} className="min-w-0 flex-1 truncate text-[13px] font-light text-text-strong hover:underline">
              {user.name}
            </Link>
            <span className="text-[11px] font-light text-opportunity-foreground">{user.reputation}</span>
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}
