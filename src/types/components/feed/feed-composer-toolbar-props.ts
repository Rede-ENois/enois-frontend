import type { ComposerActionProps } from "@/types/components/feed/composer-action-props";

export type FeedComposerToolbarProps = {
  actions: (ComposerActionProps & { key: string })[];
  publishError: string | null;
  uploadProgressText: string | null;
  publishDisabled: boolean;
  isPublishing: boolean;
  publishButtonLabel: string;
};
