import { createContext } from "react";

import type { useEditProfileDialogController } from "@/utils/components/profile/use-edit-profile-dialog-controller";

export const EditProfileDialogContext = createContext<ReturnType<
  typeof useEditProfileDialogController
> | null>(null);
