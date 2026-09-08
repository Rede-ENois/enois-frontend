import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

export function FeedComposerPublishStatus() {
  const { publishError, uploadProgressText } = useFeedComposerContext();

  return (
    <>
      {publishError && (
        <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
          {publishError}
        </p>
      )}
      {uploadProgressText && (
        <span className="text-[12px] font-light text-text-subtle">{uploadProgressText}</span>
      )}
    </>
  );
}
