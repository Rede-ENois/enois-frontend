import type { FeedComposerInputProps } from "@/types/components/feed/feed-composer-input-props";

import { FeedComposerDraftField } from "@/components/feed-composer-draft-field";
import { FeedComposerFileInput } from "@/components/feed-composer-file-input";
import { FeedComposerMediaPreview } from "@/components/feed-composer-media-preview";

export function FeedComposerInput(props: FeedComposerInputProps) {
  return (
    <>
      <FeedComposerDraftField
        profile={props.profile}
        draft={props.draft}
        onDraftChange={props.onDraftChange}
      />
      <FeedComposerMediaPreview media={props.media} onRemove={props.onRemoveMedia} />
      <FeedComposerFileInput fileRef={props.fileRef} onMediaSelect={props.onMediaSelect} />
    </>
  );
}
