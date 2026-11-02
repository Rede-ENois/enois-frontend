import { describe, expect, it } from "vitest";

import { withSecurityHeaders } from "./server";

function referrerPolicy(path: string): string | null {
  const response = withSecurityHeaders(
    new Response("<html></html>"),
    new Request(`https://enois.ia.br${path}?token=secret`),
    "nonce",
  );
  return response.headers.get("referrer-policy");
}

describe("security headers", () => {
  it.each(["/auth/callback", "/auth/reset", "/auth/verify"])(
    "never leaks the URL of %s, which carries a secret",
    (path) => {
      expect(referrerPolicy(path)).toBe("no-referrer");
    },
  );

  it("sends only the origin cross-site elsewhere", () => {
    expect(referrerPolicy("/feed")).toBe("strict-origin-when-cross-origin");
  });

  it("never lets the browser keep a rendered page", () => {
    const response = withSecurityHeaders(
      new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } }),
      new Request("https://enois.ia.br/feed"),
      "n",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("makes the service worker revalidate on every update check", () => {
    const response = withSecurityHeaders(
      new Response("self", { headers: { "content-type": "text/javascript" } }),
      new Request("https://enois.ia.br/sw.js"),
      "n",
    );
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  it("keeps the policy a route already chose", () => {
    const response = withSecurityHeaders(
      new Response("<urlset/>", {
        headers: {
          "content-type": "application/xml",
          "cache-control": "public, max-age=86400",
        },
      }),
      new Request("https://enois.ia.br/sitemap.xml"),
      "n",
    );
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
  });

  it("adds nothing to responses without a decided policy", () => {
    const response = withSecurityHeaders(
      new Response('{"ok":true}', { headers: { "content-type": "application/json" } }),
      new Request("https://enois.ia.br/api/version"),
      "n",
    );
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("isolates the window and the resources from other origins", () => {
    const response = withSecurityHeaders(
      new Response(""),
      new Request("https://enois.ia.br/"),
      "n",
    );
    expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("same-site");
    expect(response.headers.get("content-security-policy")).toContain("'nonce-n'");
  });
});
