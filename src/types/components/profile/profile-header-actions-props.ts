import type { Profile } from "@/types/application/profile/profile";

export type ProfileHeaderActionsProps = {
  profile: Profile;
  showEditAction: boolean;
  showExternalActions: boolean;
  message: () => void;
  connectionAction: {
    run: () => void;
    disabled: boolean;
    label: string;
  };
};
