import { createCommunityMembersViewModel } from "@/utils/components/communities/create-community-members-view-model";
import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";

import { CommunityMemberItem } from "@/components/community-member-item";

export function CommunityMembers() {
  const { members: communityMembers } = useCommunityDetailContext();
  const { title, members } = createCommunityMembersViewModel(communityMembers);

  return (
    <aside className="space-y-4">
      <div className="surface-card p-5">
        <h3 className="mb-3 text-sm font-semibold">{title}</h3>

        <div className="space-y-3">
          {members.map((item) => (
            <CommunityMemberItem key={item.member.userId} {...item} />
          ))}
        </div>
      </div>
    </aside>
  );
}
