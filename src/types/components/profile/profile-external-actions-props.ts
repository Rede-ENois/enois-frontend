import type { ProfileHeaderActionsProps } from "@/types/components/profile/profile-header-actions-props";

export type ProfileExternalActionsProps = Pick<
  ProfileHeaderActionsProps,
  "message" | "connectionAction"
>;
