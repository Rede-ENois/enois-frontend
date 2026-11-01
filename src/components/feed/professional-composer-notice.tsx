import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ProfessionalComposerNoticeProps } from "@/types/components/feed/professional-composer-notice-props";
import { Button } from "@rede-enois/design-system/ui";

/**
 * Stands in for the composer on the professional interface when it cannot publish: either there is
 * no active professional profile (setup invite) or the profile could not be loaded (retry), so a
 * failed request is never presented as "you have no profile".
 */
export function ProfessionalComposerNotice({
  state,
  onRetry,
  retrying = false,
}: ProfessionalComposerNoticeProps) {
  const failed = state === "ERROR";

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-text-strong">
          {failed
            ? texts.feed.composer.professionalLoadErrorTitle
            : texts.feed.composer.professionalSetupTitle}
        </p>

        <p className="text-sm text-text-subtle">
          {failed
            ? texts.feed.composer.professionalLoadErrorBody
            : texts.feed.composer.professionalSetupBody}
        </p>
      </div>

      {failed ? (
        <Button className="w-auto rounded-full" disabled={retrying} onClick={onRetry}>
          {texts.feed.composer.professionalLoadErrorRetry}
        </Button>
      ) : (
        <Link to="/profissional">
          <Button className="w-auto rounded-full">
            {texts.feed.composer.professionalSetupCta}
          </Button>
        </Link>
      )}
    </div>
  );
}
