import type { ReactNode } from "react";
import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

export type CommunityHeaderProps = {
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
