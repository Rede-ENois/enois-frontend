import { useCommunityComposerContext } from "@/utils/components/communities/use-community-composer-context";

import { CommunityComposerField } from "@/components/community-composer-field";
import { CommunityComposerSubmit } from "@/components/community-composer-submit";

export function CommunityComposer() {
  const { submit } = useCommunityComposerContext();

  return (
    <form onSubmit={submit} className="surface-card p-5">
      <CommunityComposerField />
      <CommunityComposerSubmit />
    </form>
  );
}
