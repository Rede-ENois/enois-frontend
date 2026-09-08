import { useContext } from "react";

import { CommunitiesPageContext } from "@/utils/components/communities/communities-page-context";

export function useCommunitiesPageContext() {
  const context = useContext(CommunitiesPageContext);

  if (!context) {
    throw new Error("Communities page components must be rendered inside CommunitiesPageProvider");
  }

  return context;
}
