import { CommunitiesPageContext } from "@/utils/components/communities/communities-page-context";
import { useCommunitiesPageController } from "@/utils/components/communities/use-communities-page-controller";

import { Comunidades } from "@/components/pages/communities-page";

export function CommunitiesPageProvider() {
  const value = useCommunitiesPageController();

  return (
    <CommunitiesPageContext.Provider value={value}>
      <Comunidades />
    </CommunitiesPageContext.Provider>
  );
}
