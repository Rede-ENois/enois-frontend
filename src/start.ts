import { createMiddleware, createStart } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createMiddleware().server(async ({ next }) => {
      try {
        return await next();
      } catch (error) {
        if (error != null && typeof error === "object" && "statusCode" in error) {
          throw error;
        }

        console.error(error);
        return new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }),
  ],
}));
