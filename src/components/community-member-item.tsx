import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CommunityMemberItemProps } from "@/types/components/communities/community-member-item-props";

import { Badge } from "@/components/ui/badge";

import { UserAvatar } from "@/components/user-avatar";

export function CommunityMemberItem({ member, showAdminBadge }: CommunityMemberItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Link to="/perfil/$username" params={{ username: member.username }}>
        <UserAvatar src={member.avatar} alt={member.name} className="h-9 w-9 shrink-0" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to="/perfil/$username"
          params={{ username: member.username }}
          className="truncate text-sm font-medium hover:underline"
        >
          {member.name}
        </Link>

        {showAdminBadge && (
          <Badge variant="outline" className="ml-2 rounded-full px-1.5 py-0 text-[10px]">
            {texts.communities.detail.admin}
          </Badge>
        )}
      </div>
    </div>
  );
}
