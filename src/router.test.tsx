// @vitest-environment jsdom
import { useQueryClient } from "@tanstack/react-query";

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { getRouter } from "./router";

// The CSP nonce only exists inside the server runtime.
vi.mock("./lib/csp", () => ({ readCspNonce: () => undefined }));

// The root shell, pending, notFound and error components render outside the RootComponent. Without
// the provider on the router, any of them calling react-query took the whole SSR down (QA, 31/10).
it("provides the query client around everything the router renders", () => {
  const router = getRouter();
  const Wrap = router.options.Wrap;
  expect(Wrap).toBeDefined();

  function UsesQueryClient() {
    useQueryClient();
    return <p>ok</p>;
  }

  expect(
    renderToStaticMarkup(
      Wrap ? (
        <Wrap>
          <UsesQueryClient />
        </Wrap>
      ) : null,
    ),
  ).toContain("ok");
});
