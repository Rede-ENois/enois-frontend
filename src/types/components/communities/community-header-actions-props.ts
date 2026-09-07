import type { Community } from "@/types/application/community/community";

export type CommunityHeaderActionsProps = {
  community: Community;
  isAdmin: boolean;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  closeEdit: () => void;
  membershipPending: boolean;
  membershipVariant: "secondary" | "default";
  membershipLabel: string;
  toggleMembership: () => void;
};
