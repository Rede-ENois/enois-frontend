import { texts } from "@/texts";
import { describeError } from "@/utils/describe-error";

import { ApiError } from "@/lib/api-client";

const KNOWN_CODES: Record<string, string> = texts.errors.knownCodes;

export function createErrorBannerDescription(error: unknown) {
  if (!error) return { message: "", details: [] as string[], hint: undefined };

  const { message, details } = describeError(error);
  const hint = error instanceof ApiError && error.code ? KNOWN_CODES[error.code] : undefined;
  return { message, details, hint };
}
