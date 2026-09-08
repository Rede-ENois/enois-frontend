import { FeedComposerDraftField } from "@/components/feed-composer-draft-field";
import { FeedComposerFileInput } from "@/components/feed-composer-file-input";
import { FeedComposerMediaPreview } from "@/components/feed-composer-media-preview";

export function FeedComposerInput() {
  return (
    <>
      <FeedComposerDraftField />
      <FeedComposerMediaPreview />
      <FeedComposerFileInput />
    </>
  );
}
