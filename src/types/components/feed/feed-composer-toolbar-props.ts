import type { PostView } from "@/types/application/feed/post-view";
import type { LocalMediaItem, LocalMediaType } from "./local-media";

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
