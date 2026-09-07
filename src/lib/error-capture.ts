import type { CapturedError } from "@/types/lib/captured-error";

const TTL_MS = 5_000;
let lastCapturedError: CapturedError | undefined;

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => {
    lastCapturedError = { error: (event as ErrorEvent).error ?? event, at: Date.now() };
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    lastCapturedError = { error: (event as PromiseRejectionEvent).reason, at: Date.now() };
  });
}

export function consumeCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }

  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
