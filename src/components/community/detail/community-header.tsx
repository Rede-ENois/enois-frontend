import type { ReactNode } from "react";

import type { Community, CommunityMember } from "@/lib/api";

import { CommunityHeaderActions } from "./header/community-header-actions";
import { CommunityHeaderCover } from "./header/community-header-cover";
import { CommunityHeaderIdentity } from "./header/community-header-identity";

type CommunityHeaderProps = {
  community: Community;
  admins: CommunityMember[];
  isAdmin: boolean;
  isEditOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  isMembershipPending: boolean;
  onEditOpenChange: (isOpen: boolean) => void;
  onMembership: () => void;
};

export function CommunityHeader({
  community,
  admins,
  isAdmin,
  isEditOpen,
  editForm,
  membershipLabel,
  membershipVariant,
  isMembershipPending,
  onEditOpenChange,
  onMembership,
}: CommunityHeaderProps) {
  return (
    <div className="surface-card overflow-hidden">
      <CommunityHeaderCover community={community} />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CommunityHeaderIdentity community={community} admins={admins} />
          <CommunityHeaderActions
            isAdmin={isAdmin}
            isEditOpen={isEditOpen}
            editForm={editForm}
            membershipLabel={membershipLabel}
            membershipVariant={membershipVariant}
            isMembershipPending={isMembershipPending}
            onEditOpenChange={onEditOpenChange}
            onMembership={onMembership}
          />
        </div>
      </div>
    </div>
  );
}
