import { createContext } from "react";

import type { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

export const CommunityHeaderContext = createContext<
  ReturnType<typeof useCommunityHeaderController> | null
>(null);
