import { CommunityComposerContext } from "@/utils/components/communities/community-composer-context";
import { useCommunityComposerController } from "@/utils/components/communities/use-community-composer-controller";

import { CommunityComposer } from "@/components/community-composer";

export function CommunityComposerProvider() {
  const controller = useCommunityComposerController();

  return (
    <CommunityComposerContext.Provider value={controller}>
      <CommunityComposer />
    </CommunityComposerContext.Provider>
  );
}
