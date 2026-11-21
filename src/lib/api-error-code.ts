import { ApiError } from "./api-client";

/** O código que o servidor devolveu (`TOPIC_EXISTS` e afins); `null` para falha sem código. */
export function apiErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? (error.code ?? null) : null;
}
