import { createStart } from "@tanstack/react-start";

import { startErrorMiddleware } from "@/lib/start-error-middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [startErrorMiddleware],
}));
