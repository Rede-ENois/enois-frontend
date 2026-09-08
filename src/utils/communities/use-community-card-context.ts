import { useContext } from "react";

import { CommunityCardContext } from "@/utils/communities/community-card-context";

export function useCommunityCardContext() {
  const context = useContext(CommunityCardContext);

  if (!context) {
    throw new Error("Community card components must be rendered inside CommunityCardProvider");
  }

  return context;
}
