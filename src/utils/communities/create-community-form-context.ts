import { createContext } from "react";

import type { useCreateCommunityFormController } from "@/utils/components/communities/use-create-community-form-controller";

export const CreateCommunityFormContext = createContext<ReturnType<
  typeof useCreateCommunityFormController
> | null>(null);
