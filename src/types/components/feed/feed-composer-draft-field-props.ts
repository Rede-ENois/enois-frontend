import type { FeedComposerInputProps } from "@/types/components/feed/feed-composer-input-props";

export type FeedComposerDraftFieldProps = Pick<
  FeedComposerInputProps,
  "profile" | "draft" | "onDraftChange"
>;
