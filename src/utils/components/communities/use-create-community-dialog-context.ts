import { useContext } from "react";

import { CreateCommunityDialogContext } from "@/utils/components/communities/create-community-dialog-context";

export function useCreateCommunityDialogContext() {
  const context = useContext(CreateCommunityDialogContext);

  if (!context) {
    throw new Error("Create community dialog components must be rendered inside CreateCommunityDialogProvider");
  }

  return context;
}
