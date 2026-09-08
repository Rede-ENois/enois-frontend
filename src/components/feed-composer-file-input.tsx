import type { FeedComposerFileInputProps } from "@/types/components/feed/feed-composer-file-input-props";

export function FeedComposerFileInput({ fileRef, onMediaSelect }: FeedComposerFileInputProps) {
  return (
    <input
      ref={fileRef}
      type="file"
      accept="image/*,video/*"
      multiple
      className="hidden"
      onChange={onMediaSelect}
    />
  );
}
