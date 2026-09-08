import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

import { FeedComposerInput } from "@/components/feed-composer-input";
import { FeedComposerToolbar } from "@/components/feed-composer-toolbar";

export function FeedComposer() {
  const { publishPost } = useFeedComposerContext();

  return (
    <form
      onSubmit={publishPost}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
    >
      <FeedComposerInput />
      <FeedComposerToolbar />
    </form>
  );
}
