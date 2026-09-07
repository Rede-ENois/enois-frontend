import { renderErrorPage } from "@/lib/error-page";

export function createErrorPageResponse() {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
