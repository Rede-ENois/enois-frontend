import { describe, expect, it } from "vitest";

import { moduleForPath } from "./module-paths";

describe("moduleForPath", () => {
  it("mapeia as áreas para o identificador validado pelo backend", () => {
    expect(moduleForPath("/comunidades")).toBe("COMMUNITIES");
    expect(moduleForPath("/comunidades/abc")).toBe("COMMUNITIES");
    expect(moduleForPath("/grupos/meu-grupo")).toBe("GROUPS");
    expect(moduleForPath("/mensagens")).toBe("MESSAGES");
    expect(moduleForPath("/blog/kof/post-1")).toBe("BLOGS");
    expect(moduleForPath("/vagas/minhas")).toBe("JOBS");
    expect(moduleForPath("/empresas")).toBe("COMPANIES");
    expect(moduleForPath("/mentoria")).toBe("MENTORING");
    expect(moduleForPath("/jogos-diarios")).toBe("DAILY_GAMES");
    expect(moduleForPath("/games/kof/jogo")).toBe("COMMUNITY_GAMES");
    expect(moduleForPath("/par-de-estudo")).toBe("STUDY_PAIRS");
  });

  it("Eventos controla também o Acontecendo agora (dependência do plano)", () => {
    expect(moduleForPath("/eventos")).toBe("EVENTS");
    expect(moduleForPath("/acontecendo")).toBe("EVENTS");
  });

  it("rotas fora de módulos desativáveis ficam livres", () => {
    expect(moduleForPath("/feed")).toBeNull();
    expect(moduleForPath("/perfil/kof")).toBeNull();
    expect(moduleForPath("/comunidadesx")).toBeNull();
  });
});
