import { useState } from "react";

import type { ErrorBannerProps } from "@/types/components/error-banner/error-banner-props";

import { createErrorBannerDescription } from "@/utils/components/error-banner/create-error-banner-description";
import { createErrorBannerViewModel } from "@/utils/components/error-banner/create-error-banner-view-model";
import { useErrorBannerCopy } from "@/utils/components/error-banner/use-error-banner-copy";

export function useErrorBannerController(error: ErrorBannerProps["error"]) {
  const [open, setOpen] = useState(false);
  const description = createErrorBannerDescription(error);
  const copyState = useErrorBannerCopy(
    description.message,
    description.details,
    description.hint,
  );

  return {
    ...description,
    ...createErrorBannerViewModel(Boolean(error), open, copyState.copied, description.details.length),
    toggle: () => setOpen((value) => !value),
    copy: copyState.copy,
  };
}
