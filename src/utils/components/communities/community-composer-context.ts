import { createContext } from "react";

import type { useCommunityComposerController } from "@/utils/components/communities/use-community-composer-controller";

export const CommunityComposerContext = createContext<ReturnType<
  typeof useCommunityComposerController
> | null>(null);
