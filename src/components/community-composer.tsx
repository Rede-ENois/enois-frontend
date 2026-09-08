import type { CommunityComposerProps } from "@/types/components/communities/community-composer-props";
import { useCommunityComposerController } from "@/utils/components/communities/use-community-composer-controller";

import { CommunityComposerField } from "@/components/community-composer-field";
import { CommunityComposerSubmit } from "@/components/community-composer-submit";

export function CommunityComposer({ communityId }: CommunityComposerProps) {
  const { draft, setDraft, submit, publishing, publishDisabled } =
    useCommunityComposerController(communityId);

  return (
    <form onSubmit={submit} className="surface-card p-5">
      <CommunityComposerField draft={draft} onDraftChange={setDraft} />
      <CommunityComposerSubmit publishing={publishing} disabled={publishDisabled} />
    </form>
  );
}
