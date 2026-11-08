import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, createCspNonce, permissionsPolicy } from "./csp";

function scriptSrc(policy: string): string {
  return policy.split("; ").find((d) => d.startsWith("script-src")) ?? "";
}

describe("contentSecurityPolicy", () => {
  it("allows inline scripts only through the nonce", () => {
    const src = scriptSrc(contentSecurityPolicy("abc123"));
    expect(src).toContain("'nonce-abc123'");
    expect(src).not.toContain("'unsafe-inline'");
  });

  it("falls back to unsafe-inline only without a nonce (dev server)", () => {
    expect(scriptSrc(contentSecurityPolicy(null))).toContain("'unsafe-inline'");
  });

  it("keeps clickjacking and plugin protections", () => {
    const policy = contentSecurityPolicy("n");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});

describe("createCspNonce", () => {
  it("is fresh on every call", () => {
    expect(createCspNonce()).not.toBe(createCspNonce());
    expect(createCspNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});

describe("permissionsPolicy", () => {
  it("abre microfone e câmera para a própria página e para o servidor de reunião", () => {
    const policy = permissionsPolicy(["https://meet.enois.ia.br"]);
    expect(policy).toContain("microphone=(self https://meet.enois.ia.br)");
    expect(policy).toContain("camera=(self https://meet.enois.ia.br)");
  });

  it("não abre câmera para um servidor de reunião que não é o nosso", () => {
    const policy = permissionsPolicy(["https://meet.enois.ia.br"]);
    expect(policy).not.toContain("outro.exemplo");
    // A página continua fechada para o resto.
    expect(policy).toContain("geolocation=()");
    expect(policy).toContain("payment=()");
  });

  it("sem origem de chamada configurada, só a própria página tem câmera e microfone", () => {
    const policy = permissionsPolicy([]);
    expect(policy).toContain("microphone=(self)");
    expect(policy).toContain("camera=(self)");
  });

  it("a barra final da origem não vira origem inválida na política", () => {
    expect(permissionsPolicy(["https://meet.enois.ia.br/"])).toContain(
      "camera=(self https://meet.enois.ia.br)",
    );
  });
});
