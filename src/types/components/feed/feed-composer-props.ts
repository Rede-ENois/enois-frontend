import type { FormEventHandler } from "react";
import type { PostView } from "@/types/application/feed/post-view";
import type { Profile } from "@/types/application/profile/profile";
import type { LocalMediaItem } from "./local-media-item";

export type FeedComposerProps = {
  currentUser: Profile | null | undefined;
  content: string;
  postType: PostView["type"];
  mediaItems: LocalMediaItem[];
  publicationError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onContentChange: (value: string, mentionedUserIds: string[]) => void;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
  onRemoveMedia: (index: number) => void;
};
