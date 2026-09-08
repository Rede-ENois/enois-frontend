import { createContext } from "react";

import type { useCreateCommunityDialogController } from "@/utils/components/communities/use-create-community-dialog-controller";

export const CreateCommunityDialogContext = createContext<
  ReturnType<typeof useCreateCommunityDialogController> | null
>(null);
