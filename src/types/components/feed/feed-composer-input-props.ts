import type { ChangeEventHandler, RefObject } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { MediaItem } from "@/types/components/feed/media-item";
import type { Props as MentionTextareaProps } from "@/types/components/mention-textarea/props";

export type FeedComposerInputProps = {
  profile?: Profile;
  draft: string;
  onDraftChange: MentionTextareaProps["onChange"];
  media: MediaItem[];
  fileRef: RefObject<HTMLInputElement | null>;
  onMediaSelect: ChangeEventHandler<HTMLInputElement>;
  onRemoveMedia: (index: number) => void;
};
