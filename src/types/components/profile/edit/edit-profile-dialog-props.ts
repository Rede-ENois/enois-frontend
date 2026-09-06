import type { ReactNode } from "react";
import type { Profile } from "@/lib/api";

export type EditProfileDialogProps = {
  profile: Profile;
  children: ReactNode;
};
