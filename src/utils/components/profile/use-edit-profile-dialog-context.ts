import { useContext } from "react";

import { EditProfileDialogContext } from "@/utils/components/profile/edit-profile-dialog-context";

export function useEditProfileDialogContext() {
  const context = useContext(EditProfileDialogContext);

  if (!context) {
    throw new Error("Edit profile dialog components must be rendered inside EditProfileDialogProvider");
  }

  return context;
}
