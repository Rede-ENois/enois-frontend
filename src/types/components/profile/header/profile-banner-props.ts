import type { ChangeEventHandler } from "react";
import type { Profile } from "@/lib/api";

export type ProfileBannerProps = {
  user: Profile;
  isEditable: boolean;
  isUploading: boolean;
  onSelect: ChangeEventHandler<HTMLInputElement>;
};
