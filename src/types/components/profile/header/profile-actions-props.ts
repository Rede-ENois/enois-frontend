import type { Profile } from "@/lib/api";

export type ProfileActionsProps = {
  user: Profile;
  isOwnProfile: boolean;
  connectionLabel: string;
  isConnectionDisabled: boolean;
  onMessage: () => void;
  onConnect: () => void;
};
