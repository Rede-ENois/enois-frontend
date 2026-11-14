import { describe, expect, it } from "vitest";

import { EXTERNAL_JOB_TYPES, buildJobFilters, workModelFor } from "./job-filters";

const base = {
  aba: "enois" as const,
  query: "",
  level: "",
  location: "",
  type: "",
  skills: "",
};

describe("buildJobFilters", () => {
  it("na aba do Énóis mantém os filtros da busca interna", () => {
    const filters = buildJobFilters({
      ...base,
      query: "java",
      level: "SENIOR",
      location: "Remoto",
      type: "CLT",
      skills: "spring",
    });
    expect(filters).toEqual({
      query: "java",
      level: "SENIOR",
      location: "Remoto",
      type: "CLT",
      skills: "spring",
    });
  });

  it("na aba externas traduz o Local para o modelo de trabalho que o backend filtra", () => {
    expect(buildJobFilters({ ...base, aba: "externas", location: "Remoto" })).toEqual({
      query: undefined,
      level: undefined,
      workModel: "REMOTE",
      employmentType: undefined,
    });
    expect(buildJobFilters({ ...base, aba: "externas", location: "Híbrido" }).workModel).toBe(
      "HYBRID",
    );
    expect(buildJobFilters({ ...base, aba: "externas", location: "Presencial" }).workModel).toBe(
      "ONSITE",
    );
  });

  it("nunca manda para a aba externa os parâmetros que ela ignora", () => {
    const filters = buildJobFilters({
      ...base,
      aba: "externas",
      location: "Remoto",
      type: "FULL_TIME",
      skills: "spring",
    });
    // `location`, `type` e `skills` são da busca interna: o backend externo os descarta em
    // silêncio, e a lista voltava igual com o filtro ligado.
    expect(filters).not.toHaveProperty("location");
    expect(filters).not.toHaveProperty("type");
    expect(filters).not.toHaveProperty("skills");
    expect(filters.workModel).toBe("REMOTE");
    expect(filters.employmentType).toBe("FULL_TIME");
  });

  it("descarta o vínculo da casa (CLT/PJ) ao filtrar as externas", () => {
    // Nenhum agregador publica CLT/PJ: mandar assim devolveria lista vazia sem explicação.
    expect(
      buildJobFilters({ ...base, aba: "externas", type: "CLT" }).employmentType,
    ).toBeUndefined();
    expect(
      buildJobFilters({ ...base, aba: "externas", type: "INTERN" }).employmentType,
    ).toBeUndefined();
  });

  it("na aba de salvas não inventa filtro nenhum", () => {
    expect(buildJobFilters({ ...base, aba: "salvas" })).not.toHaveProperty("source");
  });

  it("preserva o tipo travado da página de freelances", () => {
    const filters = buildJobFilters({ ...base, aba: "enois", lockedType: "FREELANCE" });
    expect(filters.type).toBe("FREELANCE");
  });
});

describe("workModelFor", () => {
  it("devolve undefined para o que o backend não reconhece", () => {
    expect(workModelFor("")).toBeUndefined();
    expect(workModelFor("Qualquer lugar")).toBeUndefined();
  });
});

describe("EXTERNAL_JOB_TYPES", () => {
  it("não oferece regimes que as fontes externas não publicam", () => {
    expect(EXTERNAL_JOB_TYPES).not.toContain("CLT");
    expect(EXTERNAL_JOB_TYPES).not.toContain("PJ");
  });
});
