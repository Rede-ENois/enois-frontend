import { ApiError } from "@/lib/api-client";
import { texts } from "@/texts";

export type ErrorDescription = {
  message: string;
  details: string[];
};

type ErrorKind = "api" | "native" | "unknown";

const errorDescribers: Record<ErrorKind, (error: unknown) => ErrorDescription> = {
  api: (error) => {
    const apiError = error as ApiError;
    const details = [
      apiError.status ? texts.errors.details.http(apiError.status) : null,
      apiError.code ?? null,
      apiError.path ? texts.errors.details.postPath(apiError.path) : null,
    ].filter((detail): detail is string => Boolean(detail));

    return { message: apiError.message, details };
  },
  native: (error) => {
    const nativeError = error as Error;
    return {
      message: nativeError.message,
      details: import.meta.env.DEV ? [nativeError.stack ?? nativeError.name] : [],
    };
  },
  unknown: () => ({ message: texts.errors.unexpected, details: [] }),
};

function getErrorKind(error: unknown): ErrorKind {
  if (error instanceof ApiError) return "api";
  if (error instanceof Error) return "native";
  return "unknown";
}

export function describeError(error: unknown): ErrorDescription {
  return errorDescribers[getErrorKind(error)](error);
}

export function getErrorHint(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || !error.code) return undefined;
  return texts.errors.knownCodes[error.code as keyof typeof texts.errors.knownCodes];
}

export function formatErrorDetails(message: string, details: string[], hint?: string): string {
  return [
    texts.errors.details.error(message),
    ...details.map((detail) => `  ${detail}`),
    hint ? texts.errors.details.suggestion(hint) : "",
  ]
    .filter(Boolean)
    .join("\n");
}
