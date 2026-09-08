import type { ChangeEventHandler, FormEvent, RefObject } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { ComposerActionProps } from "@/types/components/feed/composer-action-props";
import type { MediaItem } from "@/types/components/feed/media-item";
import type { Props as MentionTextareaProps } from "@/types/components/mention-textarea/props";

export type FeedComposerContextValue = {
  profile?: Profile;
  draft: string;
  publishError: string | null;
  publishPost: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleDraftChange: MentionTextareaProps["onChange"];
  composerActions: (ComposerActionProps & { key: string })[];
  media: MediaItem[];
  fileRef: RefObject<HTMLInputElement | null>;
  handleMediaSelect: ChangeEventHandler<HTMLInputElement>;
  removeMedia: (index: number) => void;
  uploadProgressText: string | null;
  publishDisabled: boolean;
  isPublishing: boolean;
  publishButtonLabel: string;
};
