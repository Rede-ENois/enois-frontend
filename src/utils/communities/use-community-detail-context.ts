import { useContext } from "react";

import { CommunityDetailContext } from "@/utils/components/communities/community-detail-context";

export function useCommunityDetailContext() {
  const context = useContext(CommunityDetailContext);

  if (!context) {
    throw new Error("Community detail components must be rendered inside CommunityDetailProvider");
  }

  return context;
}
