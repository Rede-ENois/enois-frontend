import type { FeedComposerPublishStatusProps } from "@/types/components/feed/feed-composer-publish-status-props";

export function FeedComposerPublishStatus({
  publishError,
  uploadProgressText,
}: FeedComposerPublishStatusProps) {
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
