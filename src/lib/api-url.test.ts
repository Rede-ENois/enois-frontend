import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { apiUrl } from "./api-client";

describe("apiUrl", () => {
  it("acrescenta o caminho à base da API, com uma única barra", () => {
    // Em teste não há `VITE_API_BACKEND`, então a base é a relativa de dev.
    expect(apiUrl("/auth/oauth/linkedin/callback")).toBe("/api/auth/oauth/linkedin/callback");
    expect(apiUrl("auth/refresh")).toBe("/api/auth/refresh");
  });

  it("mantém a query string intacta", () => {
    expect(apiUrl("/auth/oauth/linkedin/callback?code=abc&state=def")).toBe(
      "/api/auth/oauth/linkedin/callback?code=abc&state=def",
    );
  });
});

/**
 * Regressão: o callback do OAuth montava a URL com `window.location.replace("/api/...")`, um
 * caminho RELATIVO. Em produção o front e a API moram em hosts diferentes (`enois.ia.br` e
 * `api.enois.ia.br`), então o navegador ia para `/api/auth/oauth/...` no host do front e recebia
 * o 404 da página, sem nunca chegar ao backend. A base tem de vir de `apiUrl`.
 */
describe("URLs da API fora do cliente", () => {
  const fontes = [
    "src/routes/auth.callback.tsx",
    "src/lib/api/preferences.ts",
    "src/lib/api/resume-import.ts",
  ];

  it.each(fontes)("%s não usa caminho relativo /api/", (caminho) => {
    const fonte = readFileSync(join(process.cwd(), caminho), "utf8");
    expect(fonte).toContain("apiUrl(");
    expect(fonte).not.toMatch(/["'`]\/api\//);
  });
});
