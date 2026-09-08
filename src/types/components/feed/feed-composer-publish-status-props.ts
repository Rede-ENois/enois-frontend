import type { FeedComposerToolbarProps } from "@/types/components/feed/feed-composer-toolbar-props";

export type FeedComposerPublishStatusProps = Pick<
  FeedComposerToolbarProps,
  "publishError" | "uploadProgressText"
>;
