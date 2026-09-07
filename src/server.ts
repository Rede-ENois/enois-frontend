import { createErrorPageResponse } from "@/lib/create-error-page-response";
import { getServerEntry } from "@/lib/get-server-entry";
import { normalizeCatastrophicSsrResponse } from "@/lib/normalize-catastrophic-ssr-response";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return createErrorPageResponse();
    }
  },
};
