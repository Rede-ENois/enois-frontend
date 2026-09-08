import type { Props } from "@/types/components/profile/edit-profile-dialog/props";
import { EditProfileDialogContext } from "@/utils/components/profile/edit-profile-dialog-context";
import { useEditProfileDialogController } from "@/utils/components/profile/use-edit-profile-dialog-controller";

import { EditProfileDialog } from "@/components/edit-profile-dialog";

export function EditProfileDialogProvider({ children }: Props) {
  const controller = useEditProfileDialogController();

  return (
    <EditProfileDialogContext.Provider value={controller}>
      <EditProfileDialog>{children}</EditProfileDialog>
    </EditProfileDialogContext.Provider>
  );
}
