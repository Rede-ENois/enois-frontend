import type { ZodError } from "zod";

export function getZodFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0])] = issue.message;
  return errors;
}
