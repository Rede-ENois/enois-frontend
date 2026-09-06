import type { PostView } from "@/types/application/feed/post-view";
import type { LocalMediaItem } from "./local-media-item";
import type { LocalMediaType } from "./local-media-type";

export type FeedComposerToolbarProps = {
  content: string;
  postType: PostView["type"];
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  publicationError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
};
