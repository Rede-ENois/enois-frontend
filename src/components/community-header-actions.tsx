import type { CommunityHeaderActionsProps } from "@/types/components/communities/community-header-actions-props";

import { CommunityHeaderEditAction } from "@/components/community-header-edit-action";
import { CommunityMembershipAction } from "@/components/community-membership-action";

export function CommunityHeaderActions(props: CommunityHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {props.isAdmin && (
        <CommunityHeaderEditAction
          community={props.community}
          editOpen={props.editOpen}
          setEditOpen={props.setEditOpen}
          closeEdit={props.closeEdit}
        />
      )}

      <CommunityMembershipAction
        membershipPending={props.membershipPending}
        membershipVariant={props.membershipVariant}
        membershipLabel={props.membershipLabel}
        toggleMembership={props.toggleMembership}
      />
    </div>
  );
}
