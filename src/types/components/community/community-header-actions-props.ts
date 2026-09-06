import type { ReactNode } from "react";

export type CommunityHeaderActionsProps = {
  isAdmin: boolean;
  isEditOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  isMembershipPending: boolean;
  onEditOpenChange: (isOpen: boolean) => void;
  onMembership: () => void;
};
