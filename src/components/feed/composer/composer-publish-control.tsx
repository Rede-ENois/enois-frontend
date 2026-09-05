import { Loader2 } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

export function ComposerPublishControl({
  draft,
  publishError,
  isUploading,
  uploadProgress,
  isPublishing,
}: {
  draft: string;
  publishError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
}) {
  const label = isUploading ? texts.common.sending : texts.common.publishing;

  return (
    <div className="flex items-center gap-2">
      {publishError && (
        <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
          {publishError}
        </p>
      )}
      {!publishError && isUploading && (
        <span className="text-[12px] font-light text-text-subtle">
          {texts.feed.composer.uploadProgress(uploadProgress)}
        </span>
      )}
      <Button size="sm" className="rounded-full" disabled={!draft.trim() || isPublishing}>
        {isPublishing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}
          </>
        ) : (
          texts.common.publish
        )}
      </Button>
    </div>
  );
}
