import { useCommunityComposerContext } from "@/utils/communities/use-community-composer-context";

import { CommunityComposerField } from "@/components/communities/community-composer-field";
import { CommunityComposerSubmit } from "@/components/communities/community-composer-submit";

export function CommunityComposer() {
  const { submit } = useCommunityComposerContext();

  return (
    <form onSubmit={submit} className="surface-card p-5">
      <CommunityComposerField />
      <CommunityComposerSubmit />
    </form>
  );
}
