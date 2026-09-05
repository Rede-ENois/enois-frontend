import { Link } from "@tanstack/react-router";

import type { CommunityMember } from "@/lib/api";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";

export function CommunityMembers({ members }: { members: CommunityMember[] }) {
  return (
    <aside className="space-y-4">
      <div className="surface-card p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {texts.communities.detail.membersTitle(members.length)}
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3">
              <Link to="/perfil/$username" params={{ username: member.username }}>
                <UserAvatar
                  src={member.avatar}
                  alt={member.name}
                  className="h-9 w-9 shrink-0"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/perfil/$username"
                  params={{ username: member.username }}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {member.name}
                </Link>
                {member.role === "ADMIN" && (
                  <Badge
                    variant="outline"
                    className="ml-2 rounded-full px-1.5 py-0 text-[10px]"
                  >
                    {texts.communities.detail.admin}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
