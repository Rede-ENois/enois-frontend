import type { CapturedError } from "@/types/lib/captured-error";

const TTL_MS = 5_000;

export const errorCapture = (() => {
  let lastCapturedError: CapturedError | undefined;

  const record = (error: unknown) => {
    lastCapturedError = { error, at: Date.now() };
  };

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
    globalThis.addEventListener("unhandledrejection", (event) =>
      record((event as PromiseRejectionEvent).reason),
    );
  }

  return {
    consume: (): unknown => {
      if (!lastCapturedError) return undefined;
      if (Date.now() - lastCapturedError.at > TTL_MS) {
        lastCapturedError = undefined;
        return undefined;
      }

      const { error } = lastCapturedError;
      lastCapturedError = undefined;
      return error;
    },
  };
})();
