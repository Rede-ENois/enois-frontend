import type { ChangeEventHandler } from "react";
import type { Profile } from "@/lib/api";

export type ProfileHeaderProps = {
  user: Profile;
  isOwnProfile: boolean;
  isAvatarUploading: boolean;
  isBannerUploading: boolean;
  connectionLabel: string;
  isConnectionDisabled: boolean;
  onAvatarSelect: ChangeEventHandler<HTMLInputElement>;
  onBannerSelect: ChangeEventHandler<HTMLInputElement>;
  onMessage: () => void;
  onConnect: () => void;
};
