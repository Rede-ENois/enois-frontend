import { describe, expect, it, vi } from "vitest";

import { absoluteLinkUrl, internalPathOf } from "./paths";

vi.mock("@/lib/api/client-origin", () => ({ clientOrigin: () => "https://enois.ia.br" }));

const ORIGIN = "https://enois.ia.br";

describe("absoluteLinkUrl", () => {
  it("keeps an absolute http(s) address untouched", () => {
    expect(absoluteLinkUrl("https://exemplo.com/materia")).toBe("https://exemplo.com/materia");
  });

  it("turns a relative path into a page of this app", () => {
    expect(absoluteLinkUrl("/post/abc")).toBe(`${ORIGIN}/post/abc`);
  });

  it("adds the site origin to a host typed without a scheme", () => {
    expect(absoluteLinkUrl("enois.ia.br/perfil/mel")).toBe(`${ORIGIN}/enois.ia.br/perfil/mel`);
  });

  it("refuses a scheme that is not http(s)", () => {
    expect(absoluteLinkUrl("javascript:alert(1)")).toBeNull();
    expect(absoluteLinkUrl("data:text/html,<b>x</b>")).toBeNull();
  });

  it("returns null for an empty address", () => {
    expect(absoluteLinkUrl("   ")).toBeNull();
  });
});

describe("internalPathOf", () => {
  it("recognises a page of this app and keeps the query string", () => {
    expect(internalPathOf(`${ORIGIN}/post/abc?feedTab=following`)).toBe(
      "/post/abc?feedTab=following",
    );
  });

  it("treats www as the same host", () => {
    expect(internalPathOf("https://www.enois.ia.br/vagas/minhas")).toBe("/vagas/minhas");
  });

  it("does not mistake a lookalike host for this app", () => {
    expect(internalPathOf("https://enois.ia.br.evil.com/post/abc")).toBeNull();
  });

  it("returns null for an address of another site", () => {
    expect(internalPathOf("https://exemplo.com/post/abc")).toBeNull();
  });

  it("drops the fragment, which the API never receives", () => {
    expect(internalPathOf(`${ORIGIN}/perfil/mel#bio`)).toBe("/perfil/mel");
  });
});
