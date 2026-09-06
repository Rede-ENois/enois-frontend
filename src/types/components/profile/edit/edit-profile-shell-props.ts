import type { ReactNode } from "react";
import type { EditProfileTab } from "./edit-profile-tab";

export type EditProfileShellProps = {
  isOpen: boolean;
  trigger: ReactNode;
  tab: EditProfileTab;
  isSaving: boolean;
  children: ReactNode;
  onOpenChange: (isOpen: boolean) => void;
  onTabChange: (tab: EditProfileTab) => void;
  onSave: () => void;
};
