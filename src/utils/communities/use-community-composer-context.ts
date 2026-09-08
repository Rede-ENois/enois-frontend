import { useContext } from "react";

import { CommunityComposerContext } from "@/utils/components/communities/community-composer-context";

export function useCommunityComposerContext() {
  const context = useContext(CommunityComposerContext);

  if (!context) {
    throw new Error(
      "Community composer components must be rendered inside CommunityComposerProvider",
    );
  }

  return context;
}
