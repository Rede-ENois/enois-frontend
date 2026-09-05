import type { ReactNode } from "react";

import type { Community, CommunityMember } from "@/lib/api";

import { CommunityHeaderActions } from "./header/community-header-actions";
import { CommunityHeaderCover } from "./header/community-header-cover";
import { CommunityHeaderIdentity } from "./header/community-header-identity";

export function CommunityHeader({ community, admins, isAdmin, editOpen, editForm, membershipLabel, membershipVariant, membershipPending, onEditOpenChange, onMembership }: {
  community: Community;
  admins: CommunityMember[];
  isAdmin: boolean;
  editOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  membershipPending: boolean;
  onEditOpenChange: (open: boolean) => void;
  onMembership: () => void;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <CommunityHeaderCover community={community} />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CommunityHeaderIdentity community={community} admins={admins} />
          <CommunityHeaderActions
            isAdmin={isAdmin}
            editOpen={editOpen}
            editForm={editForm}
            membershipLabel={membershipLabel}
            membershipVariant={membershipVariant}
            membershipPending={membershipPending}
            onEditOpenChange={onEditOpenChange}
            onMembership={onMembership}
          />
        </div>
      </div>
    </div>
  );
}
