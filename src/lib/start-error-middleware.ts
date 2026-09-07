import { createMiddleware } from "@tanstack/react-start";

import { createErrorPageResponse } from "@/lib/create-error-page-response";

export const startErrorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error(error);
    return createErrorPageResponse();
  }
});
