import { useState } from "react";

import { texts } from "@/texts";
import type { ErrorBannerProps } from "@/types/components/error-banner/error-banner-props";
import { describeError } from "@/utils/describe-error";

import { ApiError } from "@/lib/api-client";

const KNOWN_CODES: Record<string, string> = texts.errors.knownCodes;

export function useErrorBannerController(error: ErrorBannerProps["error"]) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) {
    return {
      visible: false as const,
      open,
      copied,
      message: "",
      details: [] as string[],
      hint: undefined as string | undefined,
      toggle: () => setOpen((value) => !value),
      copy: () => {},
    };
  }

  const { message, details } = describeError(error);
  const hint = error instanceof ApiError && error.code ? KNOWN_CODES[error.code] : undefined;

  const copy = () => {
    const text = [
      texts.errors.details.error(message),
      ...details.map((detail) => `  ${detail}`),
      hint ? texts.errors.details.suggestion(hint) : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return {
    visible: true as const,
    open,
    copied,
    message,
    details,
    hint,
    showCopy: details.length > 0,
    toggle: () => setOpen((value) => !value),
    copy,
    toggleLabel: open ? texts.errors.details.hide : texts.errors.details.show,
    copyLabel: copied ? texts.errors.details.copied : texts.errors.details.copy,
  };
}
