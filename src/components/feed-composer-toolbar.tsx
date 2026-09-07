import { Loader2 } from "lucide-react";

import type { FeedComposerToolbarProps } from "@/types/components/feed/feed-composer-toolbar-props";

import { Button } from "@/components/ui/button";

import { ComposerAction } from "@/components/composer-action";

export function FeedComposerToolbar({
  actions,
  publishError,
  uploadProgressText,
  publishDisabled,
  isPublishing,
  publishButtonLabel,
}: FeedComposerToolbarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
      <div className="flex flex-wrap gap-1.5">
        {actions.map(({ key, ...action }) => (
          <ComposerAction key={key} {...action} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        {publishError && (
          <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
            {publishError}
          </p>
        )}
        {uploadProgressText && (
          <span className="text-[12px] font-light text-text-subtle">{uploadProgressText}</span>
        )}
        <Button size="sm" className="rounded-full" disabled={publishDisabled}>
          {isPublishing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />

              <>{publishButtonLabel}</>
            </>
          ) : (
            publishButtonLabel
          )}
        </Button>
      </div>
    </div>
  );
}
