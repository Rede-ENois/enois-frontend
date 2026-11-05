import type { LinkPreview } from "@/types/application/link-preview/link-preview";
import { describe, expect, it } from "vitest";

import { domainOf, labelOf, safeImageUrl, targetOf } from "./link-preview-card.helpers";

const internal: LinkPreview = {
  kind: "INTERNAL",
  url: "https://enois.ia.br/post/abc",
  title: "Mel no Énóis",
  description: "Um texto",
  imageUrl: null,
  siteName: "Post",
};

const external: LinkPreview = {
  kind: "EXTERNAL",
  url: "https://exemplo.com/materia",
  title: "Uma matéria",
  description: "A descrição que o site declara",
  imageUrl: "https://exemplo.com/capa.png",
  siteName: "Exemplo",
};

describe("targetOf", () => {
  it("opens a page of this app inside the router", () => {
    expect(targetOf(internal.url, internal, "/post/abc")).toEqual({
      href: "/post/abc",
      outside: false,
    });
  });

  it("opens another site in a new tab", () => {
    expect(targetOf(external.url, external, null)).toEqual({
      href: external.url,
      outside: true,
    });
  });

  it("sends an internal page with no known path outside instead of a dead button", () => {
    expect(targetOf(internal.url, internal, null).outside).toBe(true);
  });

  it("keeps the card simple (outside) while the preview is still unknown", () => {
    expect(targetOf(internal.url, null, "/post/abc").outside).toBe(true);
  });
});

describe("labelOf", () => {
  it("prefers the name the site declares", () => {
    expect(labelOf(external, external.url)).toBe("Exemplo");
  });

  it("uses the internal page type when that is what the backend sends", () => {
    expect(labelOf(internal, internal.url)).toBe("Post");
  });

  it("falls back to the host without www", () => {
    expect(labelOf(null, "https://www.exemplo.com/a")).toBe("exemplo.com");
  });
});

describe("safeImageUrl", () => {
  it("keeps an https image from another site", () => {
    expect(safeImageUrl("https://exemplo.com/capa.png")).toBe("https://exemplo.com/capa.png");
  });

  it("resolves a media path of this app through the CDN", () => {
    expect(safeImageUrl("/api/media/1")).toContain("https://");
    expect(safeImageUrl("/api/media/1")).toContain("/api/media/1");
  });

  it("refuses an image address that is not http(s)", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("data:image/svg+xml,<svg/>")).toBeNull();
  });

  it("has nothing to draw without an address", () => {
    expect(safeImageUrl(null)).toBeNull();
  });
});

describe("domainOf", () => {
  it("drops www and keeps the host", () => {
    expect(domainOf("https://www.exemplo.com/a/b")).toBe("exemplo.com");
  });
});
