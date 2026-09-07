import { useState } from "react";

import { texts } from "@/texts";
import type { ErrorBannerProps } from "@/types/components/error-banner/error-banner-props";
import { describeError } from "@/utils/describe-error";
import { useErrorBannerCopy } from "@/utils/components/error-banner/use-error-banner-copy";

import { ApiError } from "@/lib/api-client";

const KNOWN_CODES: Record<string, string> = texts.errors.knownCodes;

export function useErrorBannerController(error: ErrorBannerProps["error"]) {
  const [open, setOpen] = useState(false);
  const { message, details } = error ? describeError(error) : { message: "", details: [] };
  const hint = error instanceof ApiError && error.code ? KNOWN_CODES[error.code] : undefined;
  const copyState = useErrorBannerCopy(message, details, hint);

  if (!error) {
    return {
      visible: false as const,
      open,
      copied: copyState.copied,
      message,
      details,
      hint,
      toggle: () => setOpen((value) => !value),
      copy: () => {},
    };
  }

  return {
    visible: true as const,
    open,
    copied: copyState.copied,
    message,
    details,
    hint,
    showCopy: details.length > 0,
    toggle: () => setOpen((value) => !value),
    copy: copyState.copy,
    toggleLabel: open ? texts.errors.details.hide : texts.errors.details.show,
    copyLabel: copyState.copied ? texts.errors.details.copied : texts.errors.details.copy,
  };
}
