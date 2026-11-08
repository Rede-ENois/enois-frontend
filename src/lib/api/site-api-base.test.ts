import { describe, expect, it } from "vitest";

import { apiBaseForHost, parseSiteDomains } from "./site-api-base";

const SITES = ["enois.ia.br", "isweee.com"];
const PRIMARY_API = "https://api.enois.ia.br/api";

describe("apiBaseForHost", () => {
  it("o espelho chama o host de API do próprio domínio", () => {
    expect(apiBaseForHost(PRIMARY_API, "isweee.com", SITES)).toBe("https://api.isweee.com/api");
    expect(apiBaseForHost(PRIMARY_API, "ISWEEE.com", SITES)).toBe("https://api.isweee.com/api");
  });

  it("o domínio principal mantém a base do build", () => {
    expect(apiBaseForHost(PRIMARY_API, "enois.ia.br", SITES)).toBe(PRIMARY_API);
  });

  it("host desconhecido ou parecido não troca a base", () => {
    expect(apiBaseForHost(PRIMARY_API, "isweee.com.example.org", SITES)).toBe(PRIMARY_API);
    expect(apiBaseForHost(PRIMARY_API, "notisweee.com", SITES)).toBe(PRIMARY_API);
    expect(apiBaseForHost(PRIMARY_API, "localhost", SITES)).toBe(PRIMARY_API);
  });

  it("base fora do domínio principal (QA, relativa, inválida) fica como está", () => {
    const qa = "https://enois-api-qa.b7cloud.tech/api";
    expect(apiBaseForHost(qa, "isweee.com", SITES)).toBe(qa);
    expect(apiBaseForHost("/api", "isweee.com", SITES)).toBe("/api");
    expect(apiBaseForHost("não é url", "isweee.com", SITES)).toBe("não é url");
  });

  it("build com um domínio só nunca reescreve", () => {
    expect(apiBaseForHost(PRIMARY_API, "isweee.com", ["enois.ia.br"])).toBe(PRIMARY_API);
    expect(apiBaseForHost(PRIMARY_API, "isweee.com", [])).toBe(PRIMARY_API);
  });

  it("preserva caminho e barra final como vieram", () => {
    expect(apiBaseForHost("https://api.enois.ia.br", "isweee.com", SITES)).toBe(
      "https://api.isweee.com",
    );
    expect(apiBaseForHost("https://api.enois.ia.br/api/", "isweee.com", SITES)).toBe(
      "https://api.isweee.com/api/",
    );
  });
});

describe("parseSiteDomains", () => {
  it("normaliza, tira vazios e repetidos, e mantém a ordem", () => {
    expect(parseSiteDomains(" enois.ia.br , ISWEEE.com,isweee.com,, ")).toEqual(SITES);
  });

  it("sem variável não há domínios", () => {
    expect(parseSiteDomains(undefined)).toEqual([]);
    expect(parseSiteDomains("")).toEqual([]);
  });
});
