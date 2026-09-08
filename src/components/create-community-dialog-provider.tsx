import type { CreateCommunityDialogProps } from "@/types/components/communities/create-community-dialog-props";
import { CreateCommunityDialogContext } from "@/utils/components/communities/create-community-dialog-context";
import { CreateCommunityFormContext } from "@/utils/components/communities/create-community-form-context";
import { useCreateCommunityDialogController } from "@/utils/components/communities/use-create-community-dialog-controller";
import { useCreateCommunityFormController } from "@/utils/components/communities/use-create-community-form-controller";

import { CreateCommunityDialog } from "@/components/create-community-dialog";

export function CreateCommunityDialogProvider({ children }: CreateCommunityDialogProps) {
  const dialog = useCreateCommunityDialogController();
  const form = useCreateCommunityFormController(dialog.close);

  return (
    <CreateCommunityDialogContext.Provider value={dialog}>
      <CreateCommunityFormContext.Provider value={form}>
        <CreateCommunityDialog>{children}</CreateCommunityDialog>
      </CreateCommunityFormContext.Provider>
    </CreateCommunityDialogContext.Provider>
  );
}
