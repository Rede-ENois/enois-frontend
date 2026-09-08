import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

export function FeedComposerFileInput() {
  const { fileRef, handleMediaSelect } = useFeedComposerContext();

  return (
    <input
      ref={fileRef}
      type="file"
      accept="image/*,video/*"
      multiple
      className="hidden"
      onChange={handleMediaSelect}
    />
  );
}
