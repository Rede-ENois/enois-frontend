import type { ReactNode } from "react";

import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

import type { EditProfileTab } from "./edit-profile-tab";

export type EditProfileShellProps = ControlledDialogProps & {
  trigger: ReactNode;
  tab: EditProfileTab;
  isSaving: boolean;
  children: ReactNode;
  onTabChange: (tab: EditProfileTab) => void;
  onSave: () => void;
};
