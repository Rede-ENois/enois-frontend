import type { CommunityHeaderActionsProps } from "@/types/components/communities/community-header-actions-props";

export type CommunityMembershipActionProps = Pick<
  CommunityHeaderActionsProps,
  "membershipPending" | "membershipVariant" | "membershipLabel" | "toggleMembership"
>;
