import { ApiError } from "@/lib/api-client";
import { texts } from "@/texts";
import type { ErrorDescription } from "@/types/components/error-banner/error-description";

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiError) {
    const details: string[] = [];
    if (error.status) details.push(texts.errors.details.http(error.status));
    if (error.code) details.push(error.code);
    if (error.path) details.push(texts.errors.details.postPath(error.path));
    return { message: error.message, details };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      details: import.meta.env.DEV ? [error.stack ?? error.name] : [],
    };
  }
  return { message: texts.errors.unexpected, details: [] };
}
