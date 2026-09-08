import { useContext } from "react";

import { CreateCommunityFormContext } from "@/utils/components/communities/create-community-form-context";

export function useCreateCommunityFormContext() {
  const context = useContext(CreateCommunityFormContext);

  if (!context) {
    throw new Error(
      "Create community form components must be rendered inside CreateCommunityDialogProvider",
    );
  }

  return context;
}
