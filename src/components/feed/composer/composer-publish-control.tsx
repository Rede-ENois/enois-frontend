import { Loader2 } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

type ComposerPublishControlProps = {
  content: string;
  publicationError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
};

export function ComposerPublishControl({
  content,
  publicationError,
  isUploading,
  uploadProgress,
  isPublishing,
}: ComposerPublishControlProps) {
  const label = isUploading ? texts.common.sending : texts.common.publishing;

  return (
    <div className="flex items-center gap-2">
      {publicationError && (
        <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
          {publicationError}
        </p>
      )}
      {!publicationError && isUploading && (
        <span className="text-[12px] font-light text-text-subtle">
          {texts.feed.composer.uploadProgress(uploadProgress)}
        </span>
      )}
      <Button size="sm" className="rounded-full" disabled={!content.trim() || isPublishing}>
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
