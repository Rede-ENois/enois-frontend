import { texts } from "@/texts";
import type { ErrorBannerProps } from "@/types/components/error-banner/error-banner-props";
import type { ErrorDescription } from "@/types/components/error-banner/error-description";
import { ErrorBanner as ErrorBannerView } from "@rede-enois/design-system/patterns";

import { ApiError } from "@/lib/api-client";

function describe(err: unknown): ErrorDescription {
  if (err instanceof ApiError) {
    const details: string[] = [];
    if (err.status) details.push(texts.errors.details.http(err.status));
    if (err.code) details.push(err.code);
    if (err.path) details.push(texts.errors.details.postPath(err.path));
    return { message: err.message, details };
  }
  if (err instanceof Error) {
    return {
      message: err.message,
      details: import.meta.env.DEV ? [err.stack ?? err.name] : [],
    };
  }
  return { message: texts.errors.unexpected, details: [] };
}

const KNOWN_CODES: Record<string, string> = texts.errors.knownCodes;

/** Turns any thrown value (API errors included) into the design system error banner. */
export function ErrorBanner({ error, className, showDetails = true }: ErrorBannerProps) {
  if (!error) return null;
  const { message, details } = describe(error);
  const hint = error instanceof ApiError && error.code ? KNOWN_CODES[error.code] : undefined;

  return (
    <ErrorBannerView
      message={message}
      details={details}
      hint={hint}
      className={className}
      showDetails={showDetails}
    />
  );
}
