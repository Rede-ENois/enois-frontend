import { useContext } from "react";

import { CommunityHeaderContext } from "@/utils/components/communities/community-header-context";

export function useCommunityHeaderContext() {
  const context = useContext(CommunityHeaderContext);

  if (!context) {
    throw new Error("Community header components must be rendered inside CommunityHeaderProvider");
  }

  return context;
}
