import type { CommunityHeaderActionsProps } from "@/types/components/communities/community-header-actions-props";

export type CommunityHeaderEditActionProps = Pick<
  CommunityHeaderActionsProps,
  "community" | "editOpen" | "setEditOpen" | "closeEdit"
>;
